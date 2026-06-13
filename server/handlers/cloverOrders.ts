import { getCloverConfig } from "../utils/cloverConfig";
import { cloverRequest } from "../utils/cloverHttp";

/**
 * Clover order operations (platform / v3 REST API).
 *
 * Custom-order workflow step 1: create an order object in the "open" state.
 * Line items are added afterwards (next level), then the order is paid.
 */

export interface CloverOrder {
  id: string;
  state?: string;
  title?: string;
  total?: number;
  [key: string]: unknown;
}

/**
 * Create a new open order for the given merchant.
 * Returns the created order, including its `id`.
 */
export async function createCloverOrder(
  merchantId: string,
  accessToken: string,
  title = "Sikka Checkout Test Order"
): Promise<CloverOrder> {
  const { platformBaseUrl } = getCloverConfig();

  return cloverRequest<CloverOrder>({
    baseUrl: platformBaseUrl,
    path: `/v3/merchants/${merchantId}/orders`,
    accessToken,
    method: "POST",
    data: {
      state: "open",
      title,
    },
  });
}
