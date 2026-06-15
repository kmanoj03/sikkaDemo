import { useEffect, useState } from "react";

import type {
  CloverElement,
  CloverElementType,
  CloverInstance,
} from "../clover";

/**
 * Mounts Clover's hosted-iframe card elements. Each field is a Clover-owned
 * iframe, so raw card data stays within Clover. Tokenization is triggered by
 * the parent via clover.createToken().
 *
 * Clover mounts elements by CSS selector into fixed-id containers (per Clover's
 * docs), so each field has a stable id below.
 */

const fieldBox =
  "flex items-center rounded-[10px] border border-slate-200 bg-slate-50 px-3 h-[46px] overflow-hidden transition [&_iframe]:!block [&_iframe]:!h-[26px] [&_iframe]:!w-full";
const fieldLabel = "text-[13px] font-semibold text-slate-900";

const FIELDS: Array<{
  type: CloverElementType;
  id: string;
  label: string;
}> = [
  { type: "CARD_NUMBER", id: "cc-number", label: "Card number" },
  { type: "CARD_DATE", id: "cc-date", label: "Expiry" },
  { type: "CARD_CVV", id: "cc-cvv", label: "CVV" },
  { type: "CARD_POSTAL_CODE", id: "cc-postal", label: "Postal" },
];

const cloverStyles = {
  body: { fontFamily: "Inter, system-ui, sans-serif" },
  input: { fontSize: "15px", color: "#1a1c2b" },
};

interface FieldError {
  error?: string;
  touched?: boolean;
}

export function CardFields({ clover }: { clover: CloverInstance }) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const elements = clover.elements();
    const mounted: CloverElement[] = [];

    // Clear any leftover iframes (e.g. from StrictMode's double-invoke in dev)
    // so each container holds exactly one Clover element.
    for (const { id } of FIELDS) {
      document.getElementById(id)?.replaceChildren();
    }

    for (const { type, id } of FIELDS) {
      const el = elements.create(type, cloverStyles);
      el.mount(`#${id}`);
      el.addEventListener?.("change", (event: unknown) => {
        const detail = (event as Record<string, FieldError>)?.[type];
        setErrors((prev) => ({ ...prev, [type]: detail?.error ?? "" }));
      });
      mounted.push(el);
    }

    return () => {
      for (const el of mounted) {
        try {
          el.unmount();
        } catch {
          // ignore unmount errors during teardown
        }
      }
    };
  }, [clover]);

  const firstError = Object.values(errors).find(Boolean);

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className={fieldLabel}>{FIELDS[0].label}</span>
        <div className={fieldBox} id={FIELDS[0].id} />
      </label>

      <div className="grid grid-cols-3 gap-3">
        {FIELDS.slice(1).map((f) => (
          <label key={f.id} className="flex flex-col gap-1.5">
            <span className={fieldLabel}>{f.label}</span>
            <div className={fieldBox} id={f.id} />
          </label>
        ))}
      </div>

      {firstError && <p className="text-[13px] text-rose-600">{firstError}</p>}

      <p className="text-[12px] text-slate-400">
        Sandbox test card: 6011 3610 0000 6668 · any future expiry · any CVV.
      </p>
    </div>
  );
}
