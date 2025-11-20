// src/components/stock/LowStockIndicator.tsx
export default function LowStockIndicator({
  low,
  isLow,
}: { low?: boolean; isLow?: boolean }) {
  const flag = (typeof low === "boolean" ? low : isLow) ?? false;
  if (!flag) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
      ● Low stock
    </span>
  );
}