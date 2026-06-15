import { useCallback, useEffect, useState } from "react";

import {
  ApiError,
  checkout,
  disconnect,
  fetchConnection,
  fetchTransactions,
  type CheckoutResponse,
  type ConnectionInfo,
  type Transaction,
} from "./api";
import { CheckoutCard, type PayValues } from "./components/CheckoutCard";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { ResultPanel } from "./components/ResultPanel";
import { TransactionList } from "./components/TransactionList";

const cardClass =
  "rounded-2xl bg-white p-6 shadow-[0_20px_50px_-25px_rgba(20,22,60,0.45)]";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckoutResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txnLoading, setTxnLoading] = useState(true);

  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [justConnected, setJustConnected] = useState(
    () => new URLSearchParams(window.location.search).get("connected") === "1"
  );

  useEffect(() => {
    fetchConnection()
      .then(setConnection)
      .catch(() => setConnection(null));
  }, []);

  async function handleDisconnect() {
    try {
      await disconnect();
    } catch {
      // Ignore; we re-sync from the server below regardless.
    }
    setJustConnected(false);
    const next = await fetchConnection().catch(() => null);
    setConnection(next);
  }

  const loadTransactions = useCallback(async () => {
    try {
      setTransactions(await fetchTransactions());
    } catch {
      // Non-critical: the list just stays as-is.
    } finally {
      setTxnLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  async function handleCheckout(values: PayValues, sourceToken?: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await checkout({ ...values, sourceToken });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      void loadTransactions();
    }
  }

  return (
    <div className="mx-auto max-w-[1040px] px-6 pb-12 pt-8">
      <header className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 text-xl font-bold text-white shadow-lg shadow-violet-500/50">
            S
          </div>
          <div>
            <h1 className="m-0 text-xl font-bold tracking-tight text-white">
              Sikka Checkout
            </h1>
            <p className="mt-0.5 text-[13px] text-indigo-200">
              Clover payments · sandbox demo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <ConnectionStatus info={connection} onDisconnect={handleDisconnect} />
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-[0.08em] text-indigo-100">
            SANDBOX
          </span>
        </div>
      </header>

      {justConnected && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-[13px] text-emerald-200">
          <span>Clover account connected via OAuth. Payments now use the merchant's access token.</span>
          <button
            type="button"
            onClick={() => setJustConnected(false)}
            className="text-emerald-300/80 hover:text-emerald-200"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <main className="grid items-start gap-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
        <section className={`${cardClass} md:sticky md:top-6`}>
          <CheckoutCard loading={loading} onPay={handleCheckout} />
        </section>

        <div className="flex flex-col gap-5">
          <section className={cardClass}>
            <ResultPanel result={result} error={error} />
          </section>
          <TransactionList transactions={transactions} loading={txnLoading} />
        </div>
      </main>

      <footer className="mt-8 text-center text-[12px] text-indigo-300/70">
        Frontend never touches card data or Clover secrets - it only calls the
        backend.
      </footer>
    </div>
  );
}
