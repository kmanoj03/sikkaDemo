import { promises as fs } from "fs";
import path from "path";

/**
 * Local persistence for merchant OAuth credentials.
 *
 * Stored server-side only, in a gitignored JSON file. In production these
 * tokens should be encrypted at rest via a secrets manager / KMS, with
 * rotation and access controls — never a flat file.
 */

export interface MerchantCredential {
  merchantId: string;
  accessToken: string;
  refreshToken?: string;
  /** Unix timestamp (seconds) when the access token expires. */
  accessTokenExpiration?: number;
  /** Unix timestamp (seconds) when the refresh token expires. */
  refreshTokenExpiration?: number;
  updatedAt: string;
}

type Store = Record<string, MerchantCredential>;

const STORE_DIR = path.join(__dirname, "..", "logs");
const STORE_FILE = path.join(STORE_DIR, "oauth-credentials.json");

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw err;
  }
}

async function writeStore(store: Store): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

/** Persist (or replace) credentials for a merchant. */
export async function saveCredential(
  cred: Omit<MerchantCredential, "updatedAt">
): Promise<MerchantCredential> {
  const store = await readStore();
  const record: MerchantCredential = {
    ...cred,
    updatedAt: new Date().toISOString(),
  };
  store[cred.merchantId] = record;
  await writeStore(store);
  return record;
}

/**
 * Return a stored credential. With no merchantId, returns the most recently
 * updated one (sufficient for the single-merchant demo).
 */
export async function getCredential(
  merchantId?: string
): Promise<MerchantCredential | null> {
  const store = await readStore();
  if (merchantId) return store[merchantId] ?? null;

  const all = Object.values(store);
  if (all.length === 0) return null;
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

/**
 * Forget stored credentials. With a merchantId, clears just that merchant;
 * otherwise clears all. (We hold the token locally — this is our app's
 * "disconnect"; it does not revoke the grant on Clover's side.)
 */
export async function clearCredentials(merchantId?: string): Promise<void> {
  if (merchantId) {
    const store = await readStore();
    if (store[merchantId]) {
      delete store[merchantId];
      await writeStore(store);
    }
    return;
  }
  await writeStore({});
}
