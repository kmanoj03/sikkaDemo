import "dotenv/config";
import express from "express";

import { readTransactions } from "./utils/transactionLog";
import cloverRoutes from "./routes/clover";
import { CloverApiError } from "./utils/cloverHttp";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 5001;

/** Basic liveness check. */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/** Returns every locally-logged transaction (proves the logger is wired up). */
app.get("/api/transactions", async (_req, res, next) => {
  try {
    const transactions = await readTransactions();
    res.json({ count: transactions.length, transactions });
  } catch (err) {
    next(err);
  }
});

app.use("/api/clover", cloverRoutes);

/** Central error handler: surfaces Clover error details instead of a stack trace. */
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof CloverApiError) {
      return res.status(err.status ?? 502).json({
        success: false,
        message: err.message,
        cloverResponse: err.responseBody,
      });
    }
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, message });
  }
);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
