// src/components/stock/GudangSelect.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Warehouse as BaseWarehouse } from "../../types/warehouse";
import { listWarehouses } from "../../api/warehouses";

type Warehouse = BaseWarehouse & { is_default?: boolean | null };

type Props = {
  cabangId?: number;
  value?: number;
  onChange: (id: number | undefined) => void;
  disabled?: boolean;
  allowAll?: boolean;
  autoSelectFirst?: boolean;
};

export default React.memo(function GudangSelect({
  cabangId,
  value,
  onChange,
  disabled,
  allowAll,
  autoSelectFirst = true,
}: Props) {
  const [rows, setRows] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);

  // rows yang sedang berlaku untuk cabang mana
  const rowsForCabangRef = useRef<number | undefined>(undefined);
  // catat cabang yang sudah pernah auto-select (sekali per cabang)
  const lastAutoSelectedCabangRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setRows([]);
    rowsForCabangRef.current = undefined;
    lastAutoSelectedCabangRef.current = undefined;

    if (!cabangId || cabangId <= 0) return;

    let alive = true;
    setLoading(true);

    listWarehouses({ cabang_id: cabangId, is_active: true, per_page: 100 })
      .then(res => {
        if (!alive) return;
        const data = (res?.data ?? []) as Warehouse[];
        rowsForCabangRef.current = cabangId;
        setRows(data);
      })
      .catch(() => {
        // abaikan error di dropdown
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [cabangId]);

  // auto-select default/first (opsional)
  useEffect(() => {
    if (!cabangId || cabangId <= 0) return;
    if (!rows.length) return;
    if (!autoSelectFirst) return;
    if (allowAll) return;
    if (typeof value === "number" && value > 0) return;
    if (rowsForCabangRef.current !== cabangId) return;
    if (lastAutoSelectedCabangRef.current === cabangId) return;

    const def = rows.find(r => !!r.is_default) ?? rows[0];
    if (!def?.id) return;
    if (def.id === value) return;

    lastAutoSelectedCabangRef.current = cabangId;
    onChange(def.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cabangId, value, allowAll, autoSelectFirst]);

  const opts = useMemo(() => {
    return [...rows].sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  }, [rows]);

  const selected = typeof value === "number" && value > 0 ? String(value) : "";
  const isDisabled = Boolean(disabled || !cabangId || cabangId <= 0 || loading);

  return (
    <select
      className="select"
      value={selected}
      disabled={isDisabled}
      onChange={(e) => {
        const next = e.target.value ? Number(e.target.value) : undefined;
        if (next === value) return;
        onChange(next);
      }}
      aria-label="Pilih Gudang"
    >
      {allowAll && (
        <option value="">
          {cabangId ? (loading ? "Memuat..." : "Semua Gudang") : "Pilih cabang dulu"}
        </option>
      )}
      {!allowAll && (!cabangId || cabangId <= 0) && <option value="">Pilih cabang dulu</option>}

      {opts.map(g => (
        <option key={g.id} value={String(g.id)}>
          {g.nama}{g.is_default ? " · default" : ""}
        </option>
      ))}
    </select>
  );
});
