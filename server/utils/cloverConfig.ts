import "dotenv/config";

/**
 * Centralised Clover configuration.
 *
 * Clover does NOT serve all of its APIs from one base URL:
 *   - Platform / REST API (orders, line items, order payments) lives on
 *     apisandbox.dev.clover.com (sandbox).
 *   - Ecommerce API (pay for an order, charges) lives on
 *     scl-sandbox.dev.clover.com (sandbox).
 *   - OAuth authorize/token endpoints live on their own host.
 *
 * Each base URL can be overridden via env vars, but sensible defaults are
 * derived from CLOVER_ENV so local sandbox testing works out of the box.
 */

export type CloverEnv = "sandbox" | "production";

export interface CloverConfig {
  env: CloverEnv;

  /** Base URL for v3 platform REST API (orders, line items, payments). */
  platformBaseUrl: string;
  /** Base URL for v1 ecommerce API (pay for order, charges). */
  ecommerceBaseUrl: string;
  /** Base URL for the OAuth authorize flow. */
  oauthBaseUrl: string;
  /** Base URL for the card tokenizer (mints clv_ source tokens). */
  tokenizerBaseUrl: string;
  /** Base URL that serves the hosted-iframe SDK (sdk.js) used by the frontend. */
  checkoutBaseUrl: string;

  /** OAuth app credentials (used by the connect flow, added in a later level). */
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;

  /** Test-token mode: a sandbox merchant + API token for fast local testing. */
  merchantId?: string;
  testAccessToken?: string;

  /**
   * Ecommerce API private key. The ecommerce host (pay/charges) does NOT accept
   * the platform dashboard API token — it needs an Ecommerce API private key
   * or an OAuth access token. Generate it from the Clover sandbox dashboard
   * (Ecommerce API tokens -> private key).
   */
  ecommercePrivateKey?: string;

  /**
   * Ecommerce API public key (apiAccessKey). Used as the `apikey` header to
   * tokenize a card into a clv_ source token. Generated alongside the private
   * key (Clover sandbox dashboard -> Ecommerce API tokens -> public key).
   */
  ecommercePublicKey?: string;

  /** Optional static source token (clv_...); usually ephemeral, kept as an override. */
  testSource?: string;
}

const DEFAULT_BASE_URLS: Record<CloverEnv, Omit<CloverConfig, "env" | "clientId" | "clientSecret" | "redirectUri" | "merchantId" | "testAccessToken" | "ecommercePrivateKey" | "ecommercePublicKey" | "testSource">> = {
  sandbox: {
    platformBaseUrl: "https://apisandbox.dev.clover.com",
    ecommerceBaseUrl: "https://scl-sandbox.dev.clover.com",
    oauthBaseUrl: "https://sandbox.dev.clover.com",
    tokenizerBaseUrl: "https://token-sandbox.dev.clover.com",
    checkoutBaseUrl: "https://checkout.sandbox.dev.clover.com",
  },
  production: {
    platformBaseUrl: "https://api.clover.com",
    ecommerceBaseUrl: "https://scl.clover.com",
    oauthBaseUrl: "https://www.clover.com",
    tokenizerBaseUrl: "https://token.clover.com",
    checkoutBaseUrl: "https://checkout.clover.com",
  },
};

function resolveEnv(): CloverEnv {
  return process.env.CLOVER_ENV === "production" ? "production" : "sandbox";
}

export function getCloverConfig(): CloverConfig {
  const env = resolveEnv();
  const defaults = DEFAULT_BASE_URLS[env];

  return {
    env,
    platformBaseUrl: process.env.CLOVER_PLATFORM_BASE_URL || defaults.platformBaseUrl,
    ecommerceBaseUrl: process.env.CLOVER_ECOMMERCE_BASE_URL || defaults.ecommerceBaseUrl,
    oauthBaseUrl: process.env.CLOVER_OAUTH_BASE_URL || defaults.oauthBaseUrl,
    tokenizerBaseUrl: process.env.CLOVER_TOKENIZER_BASE_URL || defaults.tokenizerBaseUrl,
    checkoutBaseUrl: process.env.CLOVER_CHECKOUT_BASE_URL || defaults.checkoutBaseUrl,

    clientId: process.env.CLOVER_CLIENT_ID,
    clientSecret: process.env.CLOVER_CLIENT_SECRET,
    redirectUri: process.env.CLOVER_REDIRECT_URI,

    merchantId: process.env.CLOVER_MERCHANT_ID,
    testAccessToken: process.env.CLOVER_TEST_ACCESS_TOKEN,
    ecommercePrivateKey: process.env.CLOVER_ECOMMERCE_PRIVATE_KEY,
    ecommercePublicKey: process.env.CLOVER_ECOMMERCE_PUBLIC_KEY,
    testSource: process.env.CLOVER_TEST_SOURCE,
  };
}
