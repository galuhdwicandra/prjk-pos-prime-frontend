// src/components/products/PriceInput.tsx
import { useMemo } from "react";

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  disabled?: boolean;
  className?: string;
  /** Tampilkan placeholder mis. "0" */
  placeholder?: string;
};

function clamp(n: number, min = 0): number {
  return Number.isFinite(n) ? Math.max(min, n) : min;
}

/** Input harga yang menjaga value sebagai number murni */
export default function PriceInput({
  value,
  onChange,
  min = 0,
  disabled,
  className,
  placeholder = "0",
}: Props): React.ReactElement {
  const display = useMemo(() => String(Number.isFinite(value) ? value : 0), [value]);

  // Jika className tidak disuplai, gunakan style minimal untuk align-right dan lebar kecil
  const fallbackStyle: React.CSSProperties | undefined =
    className ? undefined : { textAlign: "right", width: "8rem" };

  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      step="1"
      placeholder={placeholder}
      className={className ?? "input"}
      style={fallbackStyle}
      value={display}
      disabled={disabled}
      onChange={(e) => {
        const n = Number(e.target.value);
        onChange(clamp(n, min));
      }}
      onBlur={(e) => {
        if (e.currentTarget.value === "") onChange(min);
      }}
    />
  );
}
