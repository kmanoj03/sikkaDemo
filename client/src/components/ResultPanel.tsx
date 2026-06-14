import type { CheckoutResponse } from "../api";
import { formatCents } from "../format";
import { StatusPill } from "./StatusPill";

interface ResultPanelProps {
  result: CheckoutResponse | null;
  error: string | null;
}

const iconBase =
  "mb-3.5 grid h-13 w-13 place-items-center rounded-full text-2xl font-bold";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-100 py-2.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="m-0 break-all text-right font-semibold">{children}</dd>
    </div>
  );
}

export function ResultPanel({ result, error }: ResultPanelProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center px-1 py-2 text-center">
        <div className={`${iconBase} bg-rose-100 text-rose-600`} aria-hidden>
          !
        </div>
        <h3 className="m-0 text-[17px] font-bold">Payment failed</h3>
        <p className="mt-2 max-w-[36ch] text-[13px] leading-relaxed text-slate-500">
          {error}
        </p>
      </div>
    );
  }

  if (result) {
    const { transaction } = result;
    return (
      <div className="flex flex-col items-center px-1 py-2 text-center">
        <div className={`${iconBase} bg-emerald-100 text-emerald-600`} aria-hidden>
          ✓
        </div>
        <h3 className="m-0 text-[17px] font-bold">Payment successful</h3>
        <p className="mt-1.5 text-3xl font-extrabold tracking-tight">
          {formatCents(transaction.amount, transaction.currency)}
        </p>

        <dl className="mt-5 flex w-full flex-col">
          <DetailRow label="Status">
            <StatusPill status={transaction.status} />
          </DetailRow>
          <DetailRow label="Order ID">
            <span className="font-mono text-[0.92em]">{result.orderId}</span>
          </DetailRow>
          {transaction.cloverPaymentId && (
            <DetailRow label="Payment ID">
              <span className="font-mono text-[0.92em]">
                {transaction.cloverPaymentId}
              </span>
            </DetailRow>
          )}
          <DetailRow label="Description">{transaction.description}</DetailRow>
        </dl>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-1 py-2 text-center">
      <div className={`${iconBase} bg-slate-100 text-slate-400`} aria-hidden>
        $
      </div>
      <h3 className="m-0 text-[17px] font-bold">No payment yet</h3>
      <p className="mt-2 max-w-[36ch] text-[13px] leading-relaxed text-slate-500">
        Enter an amount and description, then pay to run the full Clover flow.
      </p>
    </div>
  );
}
