import { getCloverConfig } from "./cloverConfig";

/**
 * Resolves the credentials needed to call Clover's REST APIs on behalf of a
 * merchant: a merchant id + an OAuth access token.
 *
 * Two modes are supported:
 *   1. Test-token mode (current): merchant id + sandbox API token from .env.
 *      Fast feedback loop for local development.
 *   2. OAuth mode (added in a later level): tokens obtained via the Clover
 *      connect flow and stored server-side, with single-use refresh handling.
 *
 * The checkout flow only ever calls getMerchantCredentials(), so swapping in
 * OAuth later won't touch any of the order/payment code.
 */

export interface MerchantCredentials {
  merchantId: string;
  accessToken: string;
}

export async function getMerchantCredentials(): Promise<MerchantCredentials> {
  const config = getCloverConfig();

  // OAuth-stored credentials will be checked here first in a later level.

  if (config.merchantId && config.testAccessToken) {
    return {
      merchantId: config.merchantId,
      accessToken: config.testAccessToken,
    };
  }

  throw new Error(
    "No Clover credentials available. Set CLOVER_MERCHANT_ID and " +
      "CLOVER_TEST_ACCESS_TOKEN in server/.env for test-token mode, or " +
      "complete the OAuth connect flow."
  );
}

/**
 * Resolves the Bearer token for Clover's ecommerce API (pay/charges).
 *
 * The ecommerce host rejects the platform dashboard API token, so in
 * test-token mode we use a dedicated Ecommerce API private key. An OAuth
 * access token works on both hosts, so OAuth mode (later) can reuse the same
 * token returned by getMerchantCredentials().
 */
export async function getEcommerceToken(): Promise<string> {
  const config = getCloverConfig();

  // In OAuth mode, the stored access token will be returned here first.

  if (config.ecommercePrivateKey) {
    return config.ecommercePrivateKey;
  }

  throw new Error(
    "No Clover ecommerce token available. Set CLOVER_ECOMMERCE_PRIVATE_KEY in " +
      "server/.env (Clover sandbox dashboard -> Ecommerce API tokens -> private " +
      "key), or complete the OAuth connect flow."
  );
}
