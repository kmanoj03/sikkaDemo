import { getCloverConfig } from "../utils/cloverConfig";
import { cloverRequest } from "../utils/cloverHttp";

/**
 * Clover order operations (platform / v3 REST API).
 *
 * Custom-order workflow step 1: create an order object in the "open" state.
 */

export interface CloverOrder {
  id: string;
  state?: string;
  title?: string;
  total?: number;
  [key: string]: unknown;
}

export interface CloverLineItem {
  id: string;
  name?: string;
  price?: number;
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

/**
 * Custom-order workflow step 2: add a custom line item to an existing order.
 *
 * `priceInCents` must already be in cents (use dollarsToCents at the boundary).
 * Clover stores line item prices as integer cents.
 */
export async function addLineItem(
  merchantId: string,
  orderId: string,
  accessToken: string,
  name: string,
  priceInCents: number
): Promise<CloverLineItem> {
  const { platformBaseUrl } = getCloverConfig();

  return cloverRequest<CloverLineItem>({
    baseUrl: platformBaseUrl,
    path: `/v3/merchants/${merchantId}/orders/${orderId}/line_items`,
    accessToken,
    method: "POST",
    data: {
      name: name || "Test Item",
      price: priceInCents,
    },
  });
}
