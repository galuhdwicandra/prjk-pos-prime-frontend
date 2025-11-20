// src/components/category/CategoryTable.tsx
import type { Category } from "../../types/category";

type Props = {
  rows: Category[];
  onEdit: (row: Category) => void;
  onDelete: (row: Category) => void;
};

export default function CategoryTable({ rows, onEdit, onDelete }: Props) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 64 }}>#</th>
            <th>Nama</th>
            <th>Slug</th>
            <th>Deskripsi</th>
            <th style={{ width: 112 }}>Status</th>
            <th style={{ width: 160 }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <div className="empty" style={{ textAlign: "center" }}>
                  Belum ada data
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td>
                  <div className="font-medium">{r.nama}</div>
                  {/* Sub-informasi untuk layar kecil tetap berguna tanpa utilitas responsive */}
                  <div className="muted" style={{ fontSize: 12 }}>{r.slug}</div>
                </td>
                <td>{r.slug}</td>
                <td>
                  {r.deskripsi ? (
                    <span>{r.deskripsi}</span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${r.is_active ? "badge-success" : "badge-danger"}`}>
                    {r.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="button" onClick={() => onEdit(r)}>
                      Edit
                    </button>
                    <button
                      className="button button-outline"
                      onClick={() => onDelete(r)}
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
