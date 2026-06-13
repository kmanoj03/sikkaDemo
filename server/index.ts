import "dotenv/config";
import express from "express";

import { readTransactions } from "./utils/transactionLog";

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

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
