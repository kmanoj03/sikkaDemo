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
