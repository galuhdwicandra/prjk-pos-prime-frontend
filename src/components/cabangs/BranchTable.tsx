// src/components/cabangs/BranchTable.tsx
import React from "react";
import type { Branch } from "../../types/branch";

type Props = {
  items: Branch[];
  onEdit: (row: Branch) => void;
  onDelete: (row: Branch) => void;
  onOpenGudang: (row: Branch) => void;
};

export default function BranchTable({ items, onEdit, onDelete, onOpenGudang }: Props): React.ReactElement {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="table" style={{ minWidth: 800, width: "100%" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama</th>
            <th>Kota</th>
            <th>Telepon</th>
            <th>Aktif</th>
            <th style={{ width: 220 }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.nama}</td>
              <td>{r.kota}</td>
              <td>{r.telepon ?? "-"}</td>
              <td>
                {r.is_active ? (
                  <span className="badge badge-success">Aktif</span>
                ) : (
                  <span className="badge badge-danger">Nonaktif</span>
                )}
              </td>
              <td>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="button button-outline" onClick={() => onOpenGudang(r)}>
                    Gudang
                  </button>
                  <button className="button button-outline" onClick={() => onEdit(r)}>
                    Edit
                  </button>
                  <button className="button button-outline" onClick={() => onDelete(r)}>
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {items.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", opacity: 0.75, padding: "16px" }}>
                Belum ada data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
