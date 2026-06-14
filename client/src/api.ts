/**
 * Typed client for the backend API. The frontend never talks to Clover
 * directly — it only calls our Express backend, which holds the secrets.
 */

export type TransactionStatus = "created" | "succeeded" | "failed";

export interface Transaction {
  timestamp: string;
  merchantId?: string;
  amount: number; // cents
  currency: string;
  description: string;
  cloverOrderId?: string;
  cloverLineItemId?: string;
  cloverPaymentId?: string;
  status: TransactionStatus;
  errorMessage?: string;
  rawCloverResponse?: unknown;
}

export interface CheckoutInput {
  amount: number; // dollars
  description: string;
  sourceToken?: string;
}

export interface CheckoutResponse {
  success: true;
  orderId: string;
  lineItemId?: string;
  status: TransactionStatus;
  payment: unknown;
  orderPayments: unknown;
  transaction: Transaction;
}

interface ApiErrorBody {
  success?: false;
  message?: string;
  cloverResponse?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly cloverResponse?: unknown;

  constructor(message: string, status: number, cloverResponse?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.cloverResponse = cloverResponse;
  }
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

export async function checkout(input: CheckoutInput): Promise<CheckoutResponse> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = (await parseJson(res)) as CheckoutResponse | ApiErrorBody;

  if (!res.ok || !(body as CheckoutResponse).success) {
    const errBody = body as ApiErrorBody;
    throw new ApiError(
      errBody?.message || `Checkout failed (${res.status})`,
      res.status,
      errBody?.cloverResponse
    );
  }

  return body as CheckoutResponse;
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch("/api/transactions");
  if (!res.ok) {
    throw new ApiError(`Failed to load transactions (${res.status})`, res.status);
  }
  const body = (await parseJson(res)) as { transactions?: Transaction[] };
  return body?.transactions ?? [];
}
