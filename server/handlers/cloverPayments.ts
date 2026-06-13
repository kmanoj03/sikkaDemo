import { getCloverConfig } from "../utils/cloverConfig";
import { cloverRequest } from "../utils/cloverHttp";

/**
 * Clover payment operations (ecommerce / v1 API).
 *
 * Note: the ecommerce API lives on a DIFFERENT host than the platform REST API
 * (scl-sandbox.dev.clover.com vs apisandbox.dev.clover.com), and the pay
 * endpoint requires User-Agent + x-forwarded-for headers.
 *
 * The `source` is a tokenized payment method (e.g. clv_...), NOT the OAuth
 * access token. Raw card details are never handled here.
 */

export interface CloverPaymentResult {
  id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * Pay for an existing order with a payment source token.
 *
 * `amountInCents` must already be in cents. A successful call returns the
 * payment/charge result from Clover.
 */
export async function payForOrder(
  orderId: string,
  accessToken: string,
  amountInCents: number,
  source: string
): Promise<CloverPaymentResult> {
  const { ecommerceBaseUrl } = getCloverConfig();

  return cloverRequest<CloverPaymentResult>({
    baseUrl: ecommerceBaseUrl,
    path: `/v1/orders/${orderId}/pay`,
    accessToken,
    method: "POST",
    data: {
      amount: amountInCents,
      currency: "usd",
      source,
      ecomind: "ecom",
    },
    headers: {
      "User-Agent": "sikka-clover-checkout-demo",
      "x-forwarded-for": "127.0.0.1",
    },
  });
}
