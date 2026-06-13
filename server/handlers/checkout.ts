import { getEcommerceToken, getMerchantCredentials } from "../utils/cloverAuth";
import { getCloverConfig } from "../utils/cloverConfig";
import { dollarsToCents } from "../utils/money";
import { logTransaction } from "../utils/transactionLog";
import type { Transaction } from "../models/transaction";
import {
  addLineItem,
  createCloverOrder,
  getOrderPayments,
} from "./cloverOrders";
import { payForOrder } from "./cloverPayments";
import { mintDemoSource } from "./cloverTokens";

/**
 * Checkout orchestration
 *
 * Runs the full Clover custom-order workflow for a single payment:
 *   validate -> create order -> add line item -> resolve source -> pay ->
 *   fetch status -> log transaction locally.
 *
 * Every attempt is logged (succeeded or failed) via the local transaction log.
 */

export interface CheckoutInput {
  /** Amount in dollars. */
  amount: number;
  description: string;
  /** Optional source token (e.g. from the Clover hosted iframe). */
  sourceToken?: string;
}

export interface CheckoutResult {
  orderId: string;
  lineItemId?: string;
  payment: unknown;
  orderPayments: unknown;
  transaction: Transaction;
}

export async function runCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const { amount, description, sourceToken } = input;
  const amountInCents = dollarsToCents(amount);

  const { merchantId, accessToken } = await getMerchantCredentials();

  // Track partial progress so a failure can still be logged with context.
  let orderId: string | undefined;
  let lineItemId: string | undefined;

  try {
    const order = await createCloverOrder(merchantId, accessToken);
    orderId = order.id;

    const lineItem = await addLineItem(
      merchantId,
      order.id,
      accessToken,
      description,
      amountInCents
    );
    lineItemId = lineItem.id;

    // Source preference: explicit token > static override > freshly minted demo token.
    const source =
      sourceToken || getCloverConfig().testSource || (await mintDemoSource());

    const ecommerceToken = await getEcommerceToken();
    const payment = await payForOrder(
      order.id,
      ecommerceToken,
      amountInCents,
      source
    );

    const orderPayments = await getOrderPayments(merchantId, order.id, accessToken);

    const transaction = await logTransaction({
      merchantId,
      amount: amountInCents,
      description,
      cloverOrderId: order.id,
      cloverLineItemId: lineItem.id,
      cloverPaymentId:
        typeof payment.charge === "string" ? payment.charge : payment.id,
      status: "succeeded",
      rawCloverResponse: { payment, orderPayments },
    });

    return { orderId: order.id, lineItemId, payment, orderPayments, transaction };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    await logTransaction({
      merchantId,
      amount: amountInCents,
      description,
      cloverOrderId: orderId,
      cloverLineItemId: lineItemId,
      status: "failed",
      errorMessage,
      rawCloverResponse: extractCloverBody(err),
    });

    throw err;
  }
}

function extractCloverBody(err: unknown): unknown {
  if (err && typeof err === "object" && "responseBody" in err) {
    return (err as { responseBody: unknown }).responseBody;
  }
  return undefined;
}
