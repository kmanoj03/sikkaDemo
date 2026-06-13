import { getCloverConfig } from "../utils/cloverConfig";
import { cloverRequest } from "../utils/cloverHttp";

/**
 * Card tokenization (Clover tokenizer host).
 *
 * A Clover `source` token (clv_...) is ephemeral, so instead of hardcoding one
 * we mint a fresh token at pay-time. The tokenizer authenticates with the
 * Ecommerce *public* key via the `apikey` header (NOT a Bearer token).
 *
 * In production the card data comes from Clover's hosted iframe on the
 * frontend (so raw card details never touch this server). For the test-token
 * demo path we tokenize a Clover sandbox test card here to get a working
 * source without building the iframe first.
 */

export interface CloverCard {
  number: string;
  exp_month: string;
  exp_year: string;
  cvv: string;
  brand?: string;
}

interface CloverTokenResponse {
  id: string;
  object?: string;
  [key: string]: unknown;
}

/** A Clover sandbox test card (from Clover's tokenization docs). */
const DEMO_TEST_CARD: CloverCard = {
  number: "6011361000006668",
  exp_month: "12",
  exp_year: "2030",
  cvv: "123",
  brand: "DISCOVER",
};

/** Tokenize a card and return the clv_ source token. */
export async function createCardToken(
  publicKey: string,
  card: CloverCard
): Promise<string> {
  const { tokenizerBaseUrl } = getCloverConfig();

  const response = await cloverRequest<CloverTokenResponse>({
    baseUrl: tokenizerBaseUrl,
    path: "/v1/tokens",
    method: "POST",
    data: { card },
    headers: { apikey: publicKey },
  });

  return response.id;
}

/**
 * Mint a fresh demo source token using the configured public key and a sandbox
 * test card. Used as the default payment source for the test-token demo path.
 */
export async function mintDemoSource(): Promise<string> {
  const { ecommercePublicKey } = getCloverConfig();

  if (!ecommercePublicKey) {
    throw new Error(
      "No Clover ecommerce public key. Set CLOVER_ECOMMERCE_PUBLIC_KEY in " +
        "server/.env (Clover sandbox dashboard -> Ecommerce API tokens -> public key)."
    );
  }

  return createCardToken(ecommercePublicKey, DEMO_TEST_CARD);
}
