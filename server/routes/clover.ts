import { Router } from "express";

import { getMerchantCredentials } from "../utils/cloverAuth";
import { createCloverOrder } from "../handlers/cloverOrders";

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

export default router;
