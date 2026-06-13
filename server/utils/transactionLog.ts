import { promises as fs } from "fs";
import path from "path";

import type { NewTransaction, Transaction } from "../models/transaction";

/**
 * Local transaction logging.
 *
 * Transactions are appended to a single JSON file (an array of entries).
 * This satisfies the "log the transaction details locally" requirement
 * without a database. In production these logs would move to a real
 * datastore with encryption, indexing, and retention policies.
 */

const LOG_DIR = path.join(__dirname, "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "transactions.json");

/**
 * Read every logged transaction. Returns an empty array if the log file
 * does not exist yet (i.e. nothing has been logged).
 */
export async function readTransactions(): Promise<Transaction[]> {
  try {
    const raw = await fs.readFile(LOG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Transaction[]) : [];
  } catch (err) {
    if (isFileNotFound(err)) return [];
    throw err;
  }
}

/**
 * Append a single transaction to the local log and return the saved entry
 * (with timestamp and defaults applied).
 */
export async function logTransaction(
  entry: NewTransaction
): Promise<Transaction> {
  const record: Transaction = {
    ...entry,
    currency: entry.currency ?? "USD",
    timestamp: new Date().toISOString(),
  };

  const existing = await readTransactions();
  existing.push(record);

  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.writeFile(LOG_FILE, JSON.stringify(existing, null, 2), "utf-8");

  return record;
}

function isFileNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as NodeJS.ErrnoException).code === "ENOENT"
  );
}
