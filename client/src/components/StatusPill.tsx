import type { TransactionStatus } from "../api";

const LABELS: Record<TransactionStatus, string> = {
  created: "Created",
  succeeded: "Succeeded",
  failed: "Failed",
};

const STYLES: Record<TransactionStatus, string> = {
  created: "text-amber-700 bg-amber-100",
  succeeded: "text-emerald-700 bg-emerald-100",
  failed: "text-rose-700 bg-rose-100",
};

export function StatusPill({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
