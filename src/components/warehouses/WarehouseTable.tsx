// src/components/warehouses/WarehouseTable.tsx
import React from "react";
import type { Warehouse } from "../../types/warehouse";

type Props = {
  items: Warehouse[];
  onEdit: (row: Warehouse) => void;
  onDelete: (row: Warehouse) => void;
};

export default function WarehouseTable({ items, onEdit, onDelete }: Props): React.ReactElement {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="table" style={{ minWidth: 800 }}>
        <thead>
          <tr>
            <th style={{ width: 80 }}>ID</th>
            <th>Cabang</th>
            <th>Nama</th>
            <th style={{ width: 110 }}>Default</th>
            <th style={{ width: 110 }}>Aktif</th>
            <th style={{ width: 180 }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.cabang?.nama ?? r.cabang_id}</td>
              <td>{r.nama}</td>
              <td>
                {r.is_default ? (
                  <span className="badge badge-success">Default</span>
                ) : (
                  <span className="badge">-</span>
                )}
              </td>
              <td>
                {r.is_active ? (
                  <span className="badge badge-success">Aktif</span>
                ) : (
                  <span className="badge badge-danger">Nonaktif</span>
                )}
              </td>
              <td>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="button" onClick={() => onEdit(r)}>Edit</button>
                  <button className="button button-outline" onClick={() => onDelete(r)}>
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center" }}>
                <span className="muted">Belum ada data.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
