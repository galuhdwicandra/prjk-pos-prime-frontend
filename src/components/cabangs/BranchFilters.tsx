// src/components/cabangs/BranchFilters.tsx
import React from "react";
import type { BranchQuery } from "../../types/branch";

type Props = {
  value: BranchQuery;
  onChange: (next: BranchQuery) => void;
  onSearch: () => void;
};

export default function BranchFilters({ value, onChange, onSearch }: Props): React.ReactElement {
  return (
    <div className="form-row form-row--3">
      {/* Cari */}
      <div>
        <label className="label" htmlFor="q">Cari</label>
        <input
          id="q"
          className="input"
          value={value.q ?? ""}
          onChange={(e) => onChange({ ...value, q: e.target.value, page: 1 })}
          placeholder="nama/alamat/telepon"
        />
      </div>

      {/* Kota */}
      <div>
        <label className="label" htmlFor="kota">Kota</label>
        <input
          id="kota"
          className="input"
          value={value.kota ?? ""}
          onChange={(e) => onChange({ ...value, kota: e.target.value || undefined, page: 1 })}
          placeholder="contoh: Bandung"
        />
      </div>

      {/* Hanya aktif + Apply */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            id="branch-active"
            type="checkbox"
            checked={Boolean(value.is_active)}
            onChange={(e) => onChange({ ...value, is_active: e.target.checked ? true : undefined, page: 1 })}
            aria-label="Hanya aktif"
          />
          <label htmlFor="branch-active" className="text-sm">Hanya aktif</label>
        </div>

        <button className="button button-primary" onClick={onSearch}>
          Terapkan
        </button>
      </div>
    </div>
  );
}
