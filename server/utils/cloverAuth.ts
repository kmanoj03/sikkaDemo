import { getValidOauthCredential } from "../handlers/cloverOauth";
import { getCloverConfig } from "./cloverConfig";

/**
 * Resolves the credentials needed to call Clover's REST APIs on behalf of a
 * merchant: a merchant id + an access token.
 *
 * Two modes are supported, OAuth taking precedence:
 *   1. OAuth mode: tokens obtained via the Clover connect flow, stored
 *      server-side, with single-use refresh handling.
 *   2. Test-token mode: merchant id + sandbox API token from .env, for a fast
 *      local feedback loop.
 *
 * The checkout flow only ever calls getMerchantCredentials(), so the auth mode
 * is transparent to all order/payment code.
 */

export interface MerchantCredentials {
  merchantId: string;
  accessToken: string;
}

export async function getMerchantCredentials(): Promise<MerchantCredentials> {
  const config = getCloverConfig();

  const oauth = await getValidOauthCredential();
  if (oauth) {
    return { merchantId: oauth.merchantId, accessToken: oauth.accessToken };
  }

  if (config.merchantId && config.testAccessToken) {
    return {
      merchantId: config.merchantId,
      accessToken: config.testAccessToken,
    };
  }

  throw new Error(
    "No Clover credentials available. Connect via OAuth, or set " +
      "CLOVER_MERCHANT_ID and CLOVER_TEST_ACCESS_TOKEN in server/.env for " +
      "test-token mode."
  );
}

/**
 * Resolves the Bearer token for Clover's ecommerce API (pay/charges).
 *
 * The ecommerce host (scl-*) is a separate auth system from the platform REST
 * API: it authenticates with the dedicated Ecommerce API private key, NOT the
 * platform OAuth access token. So we prefer the private key here and only fall
 * back to an OAuth token if no private key is configured. (Order/line-item
 * calls on the platform host still use the OAuth token via
 * getMerchantCredentials.)
 */
export async function getEcommerceToken(): Promise<string> {
  const config = getCloverConfig();

  if (config.ecommercePrivateKey) {
    return config.ecommercePrivateKey;
  }

  const oauth = await getValidOauthCredential();
  if (oauth) {
    return oauth.accessToken;
  }

  throw new Error(
    "No Clover ecommerce token available. Set CLOVER_ECOMMERCE_PRIVATE_KEY in " +
      "server/.env (Clover sandbox dashboard -> Ecommerce API tokens -> private " +
      "key), or complete the OAuth connect flow."
  );
}
