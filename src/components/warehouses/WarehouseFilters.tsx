// src/components/warehouses/WarehouseFilters.tsx
import React, { useEffect, useState } from "react";
import type { WarehouseQuery } from "../../types/warehouse";
import { listBranches } from "../../api/branches";
import { useAuth } from "../../store/auth";

type Props = {
  value: WarehouseQuery;
  onChange: (next: WarehouseQuery) => void;
  onSearch: () => void;
};

export default function WarehouseFilters({ value, onChange, onSearch }: Props): React.ReactElement {
  const { user } = useAuth();
  const [cabs, setCabs] = useState<{ id: number; nama: string }[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await listBranches({ is_active: true, per_page: 100 });
      setCabs(res.data.map(b => ({ id: b.id, nama: b.nama })));
    })();
  }, []);

  const lockCabang = user?.role === "admin_cabang" && user.cabang_id;

  return (
    <div className="form-row form-row--3">
      {/* Cari */}
      <div className="form-field">
        <label className="form-label" htmlFor="wh-q">Cari</label>
        <input
          id="wh-q"
          className="input"
          value={value.q ?? ""}
          onChange={(e) => onChange({ ...value, q: e.target.value, page: 1 })}
          placeholder="nama gudang"
        />
      </div>

      {/* Cabang */}
      <div className="form-field">
        <label className="form-label" htmlFor="wh-cabang">Cabang</label>
        <select
          id="wh-cabang"
          className="select"
          value={lockCabang ? String(lockCabang) : String(value.cabang_id ?? "")}
          onChange={(e) =>
            onChange({
              ...value,
              cabang_id: e.target.value ? Number(e.target.value) : undefined,
              page: 1,
            })
          }
          disabled={Boolean(lockCabang)}
        >
          {!lockCabang && <option value="">Semua Cabang</option>}
          {cabs.map(c => (
            <option key={c.id} value={c.id}>{c.nama}</option>
          ))}
        </select>
      </div>

      {/* Hanya aktif + tombol */}
      <div className="form-field" style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            id="wh-active"
            type="checkbox"
            checked={Boolean(value.is_active)}
            onChange={(e) =>
              onChange({
                ...value,
                is_active: e.target.checked ? true : undefined,
                page: 1,
              })
            }
          />
          <label htmlFor="wh-active" className="muted">Hanya aktif</label>
        </div>
        <button className="button button-primary" onClick={onSearch}>
          Terapkan
        </button>
      </div>
    </div>
  );
}
