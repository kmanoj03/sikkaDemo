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

  /** OAuth app credentials (used by the connect flow, added in a later level). */
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;

  /** Test-token mode: a sandbox merchant + API token for fast local testing. */
  merchantId?: string;
  testAccessToken?: string;

  /** Sandbox payment source token (e.g. clv_...) used to pay an order. */
  testSource?: string;
}

const DEFAULT_BASE_URLS: Record<CloverEnv, Omit<CloverConfig, "env" | "clientId" | "clientSecret" | "redirectUri" | "merchantId" | "testAccessToken" | "testSource">> = {
  sandbox: {
    platformBaseUrl: "https://apisandbox.dev.clover.com",
    ecommerceBaseUrl: "https://scl-sandbox.dev.clover.com",
    oauthBaseUrl: "https://sandbox.dev.clover.com",
  },
  production: {
    platformBaseUrl: "https://api.clover.com",
    ecommerceBaseUrl: "https://scl.clover.com",
    oauthBaseUrl: "https://www.clover.com",
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

    clientId: process.env.CLOVER_CLIENT_ID,
    clientSecret: process.env.CLOVER_CLIENT_SECRET,
    redirectUri: process.env.CLOVER_REDIRECT_URI,

    merchantId: process.env.CLOVER_MERCHANT_ID,
    testAccessToken: process.env.CLOVER_TEST_ACCESS_TOKEN,
    testSource: process.env.CLOVER_TEST_SOURCE,
  };
}
