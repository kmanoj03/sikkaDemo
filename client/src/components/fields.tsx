const inputClass =
  "w-full rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-3 text-[15px] text-slate-900 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-brand-500/15 disabled:opacity-60";

const labelClass = "text-[13px] font-semibold text-slate-900";

interface MoneyFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function MoneyField({ value, onChange, disabled }: MoneyFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>Amount</span>
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="25.00"
          disabled={disabled}
        />
      </div>
    </label>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      <input
        className={inputClass}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </label>
  );
}
