import type { Transaction } from "../api";
import { formatCents, formatTime } from "../format";
import { StatusPill } from "./StatusPill";

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
}

export function TransactionList({ transactions, loading }: TransactionListProps) {
  return (
    <section className="rounded-2xl bg-white px-6 pb-2 pt-5 shadow-[0_20px_50px_-25px_rgba(20,22,60,0.45)]">
      <header className="mb-1.5 flex items-center gap-2.5">
        <h2 className="m-0 text-base font-bold">Recent transactions</h2>
        <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[12px] font-bold text-brand-500">
          {transactions.length}
        </span>
      </header>

      {loading && transactions.length === 0 ? (
        <p className="py-4 pb-6 text-sm text-slate-500">Loading…</p>
      ) : transactions.length === 0 ? (
        <p className="py-4 pb-6 text-sm text-slate-500">
          No transactions logged yet.
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {[...transactions].reverse().map((txn, i) => (
            <li
              className="flex items-center justify-between gap-4 border-t border-slate-100 py-3.5"
              key={`${txn.cloverOrderId ?? "txn"}-${i}`}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">
                  {txn.description}
                </span>
                <span className="text-[12px] text-slate-500">
                  {formatTime(txn.timestamp)}
                  {txn.cloverOrderId && (
                    <>
                      {" · "}
                      <span className="font-mono">{txn.cloverOrderId}</span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <span className="text-sm font-bold">
                  {formatCents(txn.amount, txn.currency)}
                </span>
                <StatusPill status={txn.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
