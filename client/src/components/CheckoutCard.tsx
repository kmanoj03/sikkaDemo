import { useEffect, useState } from "react";

import { describeTokenErrors } from "../clover";
import { useClover } from "../hooks/useClover";
import { CardFields } from "./CardFields";
import { MoneyField, TextField } from "./fields";

export interface PayValues {
  amount: number;
  description: string;
}

interface CheckoutCardProps {
  loading: boolean;
  onPay: (values: PayValues, sourceToken?: string) => void;
}

type Mode = "demo" | "card";

export function CheckoutCard({ loading, onPay }: CheckoutCardProps) {
  const { clover, cardEntryEnabled, loading: cloverLoading, ensureLoaded } =
    useClover();

  const [mode, setMode] = useState<Mode>("demo");
  const [amount, setAmount] = useState("25.00");
  const [description, setDescription] = useState("Dental billing payment");
  const [formError, setFormError] = useState<string | null>(null);
  const [tokenizing, setTokenizing] = useState(false);

  const busy = loading || tokenizing;

  // Clover's SDK injects a branding footer + reCAPTCHA into <body>. Mark the
  // body while in card mode so that injected UI is only shown then (see CSS).
  useEffect(() => {
    document.body.classList.toggle("card-mode", mode === "card");
    return () => document.body.classList.remove("card-mode");
  }, [mode]);

  function selectCardMode() {
    setFormError(null);
    setMode("card");
    ensureLoaded();
  }

  function validate(): PayValues | null {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFormError("Enter an amount greater than 0.");
      return null;
    }
    if (description.trim() === "") {
      setFormError("Enter a description.");
      return null;
    }
    setFormError(null);
    return { amount: parsed, description: description.trim() };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const values = validate();
    if (!values) return;

    if (mode === "demo") {
      onPay(values);
      return;
    }

    if (!clover) {
      setFormError("Card entry is not ready yet.");
      return;
    }

    setTokenizing(true);
    try {
      const result = await clover.createToken();
      if (result.errors || !result.token) {
        setFormError(describeTokenErrors(result.errors));
        return;
      }
      onPay(values, result.token);
    } catch {
      setFormError("Could not tokenize the card. Please try again.");
    } finally {
      setTokenizing(false);
    }
  }

  return (
    <>
      <div className="mb-4.5">
        <h2 className="m-0 text-lg font-bold">New payment</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
          Create an order, add a line item, and charge it through Clover.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-[12px] bg-slate-100 p-1">
        <ModeButton active={mode === "demo"} onClick={() => setMode("demo")}>
          Demo token
        </ModeButton>
        <ModeButton
          active={mode === "card"}
          disabled={!cardEntryEnabled}
          onClick={selectCardMode}
        >
          Card entry
        </ModeButton>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <MoneyField value={amount} onChange={setAmount} disabled={busy} />
        <TextField
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="Payment description"
          disabled={busy}
        />

        {mode === "card" &&
          (clover ? (
            <CardFields clover={clover} />
          ) : (
            <p className="text-[13px] text-slate-500">
              {cloverLoading
                ? "Loading secure card form…"
                : "Card entry is unavailable."}
            </p>
          ))}

        {formError && <p className="-mt-1 text-[13px] text-rose-600">{formError}</p>}

        <button
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-600 px-4.5 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-75"
          type="submit"
          disabled={busy}
        >
          {busy ? (
            <>
              <span
                className="h-4 w-4 animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-white/40 border-t-white"
                aria-hidden
              />
              {tokenizing ? "Tokenizing…" : "Processing…"}
            </>
          ) : (
            "Pay with Clover"
          )}
        </button>

        <p className="text-center text-[12px] text-slate-400">
          {mode === "demo"
            ? "A sandbox test card is tokenized server-side for this payment."
            : "Card details are entered in Clover's secure iframe and never touch our server."}
        </p>
      </form>
    </>
  );
}

function ModeButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[9px] px-3 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-white text-brand-600 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}
