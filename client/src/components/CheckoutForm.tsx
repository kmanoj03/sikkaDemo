import { useState } from "react";

export interface CheckoutFormValues {
  amount: number;
  description: string;
}

interface CheckoutFormProps {
  loading: boolean;
  onSubmit: (values: CheckoutFormValues) => void;
}

const inputClass =
  "w-full rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-3 text-[15px] text-slate-900 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-brand-500/15 disabled:opacity-60";

export function CheckoutForm({ loading, onSubmit }: CheckoutFormProps) {
  const [amount, setAmount] = useState("25.00");
  const [description, setDescription] = useState("Dental billing payment");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    if (description.trim() === "") {
      setError("Enter a description.");
      return;
    }
    setError(null);
    onSubmit({ amount: parsed, description: description.trim() });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-slate-900">Amount</span>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3.5 text-[15px] font-semibold text-slate-400">
            $
          </span>
          <input
            className={`${inputClass} pl-7`}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="25.00"
            disabled={loading}
          />
        </div>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-slate-900">
          Description
        </span>
        <input
          className={inputClass}
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Payment description"
          disabled={loading}
        />
      </label>

      {error && <p className="-mt-1 text-[13px] text-rose-600">{error}</p>}

      <button
        className="inline-flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-600 px-4.5 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-75"
        type="submit"
        disabled={loading}
      >
        {loading ? (
          <>
            <span
              className="h-4 w-4 animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-white/40 border-t-white"
              aria-hidden
            />
            Processing…
          </>
        ) : (
          "Pay with Clover"
        )}
      </button>

      <p className="text-center text-[12px] text-slate-400">
        Sandbox demo · a test card is tokenized server-side for this payment.
      </p>
    </form>
  );
}
