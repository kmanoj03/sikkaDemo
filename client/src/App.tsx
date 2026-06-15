import { useCallback, useEffect, useState } from "react";

import {
  ApiError,
  checkout,
  fetchTransactions,
  type CheckoutResponse,
  type Transaction,
} from "./api";
import { CheckoutCard, type PayValues } from "./components/CheckoutCard";
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
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-[0.08em] text-indigo-100">
          SANDBOX
        </span>
      </header>

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
