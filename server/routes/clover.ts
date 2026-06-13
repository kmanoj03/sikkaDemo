import { Router } from "express";

import { getEcommerceToken, getMerchantCredentials } from "../utils/cloverAuth";
import {
  addLineItem,
  createCloverOrder,
  getOrderPayments,
} from "../handlers/cloverOrders";
import { payForOrder } from "../handlers/cloverPayments";
import { mintDemoSource } from "../handlers/cloverTokens";
import { getCloverConfig } from "../utils/cloverConfig";
import { dollarsToCents } from "../utils/money";

/**
 * Clover routes For now: create an order, so we can
 * confirm the backend can authenticate to and talk to the Clover sandbox.
 */
const router = Router();

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
