/**
 * Shape of a single locally-logged transaction.
 *
 * Money is always stored in cents (integer) to match Clover's API,
 * which represents amounts in the smallest currency unit (e.g. $20.99 -> 2099).
 *
 * We never store raw card details here. Only the tokenized/processed
 * results that Clover returns are kept for auditing the demo.
 */

export type TransactionStatus = "created" | "succeeded" | "failed";

export interface Transaction {
  /** Timestamp of when this entry was logged. */
  timestamp: string;

  /** Clover merchant this transaction belongs to. */
  merchantId?: string;

  /** Amount in cents (integer). */
  amount: number;

  /** Currency code, e.g. "USD". */
  currency: string;

  /** Human-readable description entered at checkout. */
  description: string;

  /** Clover order id, once the order has been created. */
  cloverOrderId?: string;

  /** Clover line item id, once the line item has been added. */
  cloverLineItemId?: string;

  /** Clover payment id, once the order has been paid. */
  cloverPaymentId?: string;

  /** Outcome of the checkout attempt. */
  status: TransactionStatus;

  /** Populated when status is "failed". */
  errorMessage?: string;

  /** Raw Clover response(s), kept for debugging the demo. */
  rawCloverResponse?: unknown;
}

/**
 * Fields the caller supplies. `timestamp` is filled in by the logger,
 * and `currency` defaults to "USD" if omitted.
 */
export type NewTransaction = Omit<Transaction, "timestamp" | "currency"> & {
  currency?: string;
};
