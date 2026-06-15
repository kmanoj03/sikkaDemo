import { getCloverConfig } from "../utils/cloverConfig";
import { cloverRequest } from "../utils/cloverHttp";
import {
  getCredential,
  saveCredential,
  type MerchantCredential,
} from "../utils/oauthStore";

/**
 * Clover OAuth 2.0 (v2 expiring-token) flow.
 *
 * - Authorize: redirect the merchant to the OAuth host.
 * - Token: exchange the authorization code for an access/refresh token pair
 *   (server-to-server, on the platform host).
 * - Refresh: refresh tokens are SINGLE-USE — once exchanged, the old one is
 *   invalid, so the new pair must be persisted immediately.
 */

interface TokenResponse {
  access_token: string;
  access_token_expiration?: number;
  refresh_token?: string;
  refresh_token_expiration?: number;
}

/** Refresh slightly before actual expiry to avoid races. */
const EXPIRY_BUFFER_SECONDS = 60;

export function buildAuthorizeUrl(): string {
  const { oauthBaseUrl, clientId, redirectUri } = getCloverConfig();
  if (!clientId) {
    throw new Error("CLOVER_CLIENT_ID is not set; cannot start the OAuth flow.");
  }

  const url = new URL(`${oauthBaseUrl}/oauth/v2/authorize`);
  url.searchParams.set("client_id", clientId);
  if (redirectUri) url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  return url.toString();
}

export async function exchangeCodeForTokens(
  code: string
): Promise<TokenResponse> {
  const { platformBaseUrl, clientId, clientSecret } = getCloverConfig();
  if (!clientId || !clientSecret) {
    throw new Error("CLOVER_CLIENT_ID and CLOVER_CLIENT_SECRET must be set.");
  }

  return cloverRequest<TokenResponse>({
    baseUrl: platformBaseUrl,
    path: "/oauth/v2/token",
    method: "POST",
    data: { client_id: clientId, client_secret: clientSecret, code },
  });
}

async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const { platformBaseUrl, clientId } = getCloverConfig();
  return cloverRequest<TokenResponse>({
    baseUrl: platformBaseUrl,
    path: "/oauth/v2/refresh",
    method: "POST",
    data: { client_id: clientId, refresh_token: refreshToken },
  });
}

export async function storeTokensForMerchant(
  merchantId: string,
  tokens: TokenResponse
): Promise<MerchantCredential> {
  return saveCredential({
    merchantId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessTokenExpiration: tokens.access_token_expiration,
    refreshTokenExpiration: tokens.refresh_token_expiration,
  });
}

/**
 * Return a stored OAuth credential with a valid access token, refreshing
 * (and persisting the new single-use pair immediately) if it has expired.
 * Returns null if no OAuth credential is stored.
 */
export async function getValidOauthCredential(
  merchantId?: string
): Promise<MerchantCredential | null> {
  const cred = await getCredential(merchantId);
  if (!cred) return null;

  const now = Math.floor(Date.now() / 1000);
  const expiresSoon =
    cred.accessTokenExpiration != null &&
    cred.accessTokenExpiration - EXPIRY_BUFFER_SECONDS <= now;

  if (!expiresSoon || !cred.refreshToken) return cred;

  // Refresh, then persist the new pair immediately (old refresh token is now dead).
  const tokens = await refreshTokens(cred.refreshToken);
  return storeTokensForMerchant(cred.merchantId, tokens);
}
