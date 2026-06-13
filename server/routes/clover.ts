import { Router } from "express";

import { getMerchantCredentials } from "../utils/cloverAuth";
import { addLineItem, createCloverOrder } from "../handlers/cloverOrders";
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

export default router;
