import { Router } from "express";

import { runCheckout } from "../handlers/checkout";

/**
 * The single endpoint the frontend calls. Validates input, then runs the full
 * Clover checkout flow and returns the result (the heavy lifting + local
 * transaction logging happens in runCheckout).
 */
const router = Router();

/**
 * POST /api/checkout
 * Body: { amount: number (dollars), description: string, sourceToken?: string }
 */
router.post("/", async (req, res, next) => {
  try {
    const { amount, description, sourceToken } = req.body as {
      amount?: number;
      description?: string;
      sourceToken?: string;
    };

    if (typeof amount !== "number" || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "amount (in dollars) must be a number greater than 0" });
    }
    if (typeof description !== "string" || description.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "description is required" });
    }

    const result = await runCheckout({
      amount,
      description: description.trim(),
      sourceToken,
    });

    res.json({
      success: true,
      orderId: result.orderId,
      lineItemId: result.lineItemId,
      status: result.transaction.status,
      payment: result.payment,
      orderPayments: result.orderPayments,
      transaction: result.transaction,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
