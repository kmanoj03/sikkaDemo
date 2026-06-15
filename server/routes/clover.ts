import { Router } from "express";

import { getEcommerceToken, getMerchantCredentials } from "../utils/cloverAuth";
import {
  addLineItem,
  createCloverOrder,
  getOrderPayments,
} from "../handlers/cloverOrders";
import { payForOrder } from "../handlers/cloverPayments";
import { mintDemoSource } from "../handlers/cloverTokens";
import {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  storeTokensForMerchant,
} from "../handlers/cloverOauth";
import { getCloverConfig } from "../utils/cloverConfig";
import { clearCredentials, getCredential } from "../utils/oauthStore";
import { dollarsToCents } from "../utils/money";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Clover routes For now: create an order, so we can
 * confirm the backend can authenticate to and talk to the Clover sandbox.
 */
const router = Router();

/**
 * GET /api/clover/public-config -> browser-safe config for the hosted iframe.
 * Returns only the public key + merchant id + SDK url. The private key and
 * access tokens never leave the server.
 */
router.get("/public-config", (_req, res) => {
  const { ecommercePublicKey, merchantId, checkoutBaseUrl } = getCloverConfig();
  res.json({
    publicKey: ecommercePublicKey ?? null,
    merchantId: merchantId ?? null,
    sdkUrl: `${checkoutBaseUrl}/sdk.js`,
    cardEntryEnabled: Boolean(ecommercePublicKey && merchantId),
  });
});

/**
 * GET /api/clover/oauth/connect
 *
 * Single entry point that matches the Clover app's configured launch path.
 * Clover redirects the merchant here, and with "Default OAuth Response: CODE"
 * it appends ?merchant_id=...&code=... once the merchant approves.
 *
 *   - No code yet   -> start the flow by redirecting to Clover's authorize page.
 *   - code present  -> exchange it for tokens, store them, return to the UI.
 */
router.get("/oauth/connect", async (req, res, next) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const merchantId =
      typeof req.query.merchant_id === "string" ? req.query.merchant_id : "";

    if (!code) {
      return res.redirect(buildAuthorizeUrl());
    }

    if (!merchantId) {
      return res
        .status(400)
        .send("Missing merchant_id in OAuth callback.");
    }

    const tokens = await exchangeCodeForTokens(code);
    await storeTokensForMerchant(merchantId, tokens);

    res.redirect(`${FRONTEND_URL}/?connected=1`);
  } catch (err) {
    next(err);
  }
});

/** GET /api/clover/connection -> current auth mode (oauth | test | none). */
router.get("/connection", async (_req, res, next) => {
  try {
    const oauth = await getCredential();
    const config = getCloverConfig();
    const mode = oauth
      ? "oauth"
      : config.merchantId && config.testAccessToken
        ? "test"
        : "none";

    res.json({
      mode,
      connected: Boolean(oauth),
      merchantId: oauth?.merchantId ?? config.merchantId ?? null,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/clover/connection -> forget stored OAuth tokens (local only).
 * Does not revoke the grant on Clover's side; it just drops our copy so the
 * app falls back to test-token mode.
 */
router.delete("/connection", async (_req, res, next) => {
  try {
    await clearCredentials();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/** POST /api/clover/orders -> create a new open order for the merchant. */
router.post("/orders", async (_req, res, next) => {
  try {
    const { merchantId, accessToken } = await getMerchantCredentials();
    const order = await createCloverOrder(merchantId, accessToken);
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/clover/orders/:orderId/line-items -> add a custom line item.
 * Body: { amount: number (dollars), description?: string }
 */
router.post("/orders/:orderId/line-items", async (req, res, next) => {
  try {
    const { amount, description } = req.body as {
      amount?: number;
      description?: string;
    };

    if (typeof amount !== "number" || amount <= 0) {
      return res
        .status(400)
        .json({ message: "amount (in dollars) must be a number greater than 0" });
    }

    const { merchantId, accessToken } = await getMerchantCredentials();
    const lineItem = await addLineItem(
      merchantId,
      req.params.orderId,
      accessToken,
      description ?? "Test Item",
      dollarsToCents(amount)
    );
    res.json({ success: true, lineItem });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/clover/orders/:orderId/pay -> pay for an order with a source token.
 * Body: { amount: number (dollars), sourceToken?: string }
 * Falls back to CLOVER_TEST_SOURCE when no sourceToken is provided.
 */
router.post("/orders/:orderId/pay", async (req, res, next) => {
  try {
    const { amount, sourceToken } = req.body as {
      amount?: number;
      sourceToken?: string;
    };

    if (typeof amount !== "number" || amount <= 0) {
      return res
        .status(400)
        .json({ message: "amount (in dollars) must be a number greater than 0" });
    }

    // Source preference: explicit token (e.g. from the iframe) > static
    // override > a freshly minted demo token (test-token path).
    const source =
      sourceToken || getCloverConfig().testSource || (await mintDemoSource());

    const ecommerceToken = await getEcommerceToken();
    const payment = await payForOrder(
      req.params.orderId,
      ecommerceToken,
      dollarsToCents(amount),
      source
    );
    res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
});

/** GET /api/clover/orders/:orderId/payments -> payment status for an order. */
router.get("/orders/:orderId/payments", async (req, res, next) => {
  try {
    const { merchantId, accessToken } = await getMerchantCredentials();
    const payments = await getOrderPayments(
      merchantId,
      req.params.orderId,
      accessToken
    );
    res.json({ success: true, payments });
  } catch (err) {
    next(err);
  }
});

export default router;
