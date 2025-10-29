import React from "react";
import type { Role } from "../../types/user";

type Props = {
  q: string;
  role: Role | "";
  cabangId: number | "";
  isActive: "" | "1" | "0";
  onChange: (next: Partial<{ q: string; role: Role | ""; cabangId: number | ""; isActive: "" | "1" | "0" }>) => void;
  onReset: () => void;
  onSearch: () => void;
};

export default function UserFilters(props: Props): React.ReactElement {
  return (
    <div className="form-row">
      {/* Keyword */}
      <div className="form-field">
        <label htmlFor="uf-q" className="form-label">Kata Kunci</label>
        <input
          id="uf-q"
          value={props.q}
          onChange={(e) => props.onChange({ q: e.target.value })}
          placeholder="Cari nama / email / phone…"
          className="input"
        />
      </div>

      {/* Role */}
      <div className="form-field">
        <label htmlFor="uf-role" className="form-label">Role</label>
        <select
          id="uf-role"
          value={props.role}
          onChange={(e) => props.onChange({ role: (e.target.value || "") as Role | "" })}
          className="select"
        >
          <option value="">Semua Role</option>
          <option value="superadmin">Superadmin</option>
          <option value="admin_cabang">Admin Cabang</option>
          <option value="gudang">Gudang</option>
          <option value="kasir">Kasir</option>
          <option value="sales">Sales</option>
          <option value="kurir">Kurir</option>
        </select>
      </div>

      {/* Cabang ID */}
      <div className="form-field">
        <label htmlFor="uf-cabang" className="form-label">Cabang ID</label>
        <input
          id="uf-cabang"
          type="number"
          min={1}
          value={props.cabangId}
          onChange={(e) => props.onChange({ cabangId: e.target.value === "" ? "" : Number(e.target.value) })}
          placeholder="Mis. 1"
          className="input"
        />
      </div>

      {/* Status */}
      <div className="form-field">
        <label htmlFor="uf-active" className="form-label">Status</label>
        <select
          id="uf-active"
          value={props.isActive}
          onChange={(e) => props.onChange({ isActive: e.target.value as "" | "1" | "0" })}
          className="select"
        >
          <option value="">Semua Status</option>
          <option value="1">Aktif</option>
          <option value="0">Nonaktif</option>
        </select>
      </div>

      {/* Actions */}
      <div className="form-actions" style={{ display: "flex", gap: 8 }}>
        <button onClick={props.onSearch} className="button button-primary">Cari</button>
        <button onClick={props.onReset} className="button button-outline">Reset</button>
      </div>
    </div>
  );
}
