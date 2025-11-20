import React from "react";
import type { Paginated } from "../../types/http";
import type { User } from "../../types/user";
import RoleBadge from "./RoleBadge";

type Props = {
  data: Paginated<User> | null;
  loading: boolean;
  onEdit: (u: User) => void;
  onDelete: (u: User) => void;
  page: number;
  onPage: (p: number) => void;
};

export default function UserTable(props: Props): React.ReactElement {
  if (props.loading) {
    return <div style={{ padding: "12px", opacity: 0.8, fontSize: "0.9rem" }}>Memuat data…</div>;
  }

  const empty = !props.data || props.data.data.length === 0;

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Email</th>
            <th>Telepon</th>
            <th>Role</th>
            <th>Cabang</th>
            <th>Status</th>
            <th style={{ width: 150 }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: "24px 12px", opacity: 0.7 }}>
                Belum ada data.
              </td>
            </tr>
          ) : (
            props.data!.data.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone ?? "-"}</td>
                <td><RoleBadge role={u.role} /></td>
                <td>{u.cabang_id ?? "-"}</td>
                <td>
                  <span className={`badge ${u.is_active ? "badge-success" : "badge-danger"}`}>
                    {u.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => props.onEdit(u)} className="button">Edit</button>
                    <button onClick={() => props.onDelete(u)} className="button button-outline">Hapus</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {props.data && props.data.meta.last_page > 1 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderTop: "1px solid var(--border-color, #e5e7eb)"
        }}>
          <div>
            <small>Hal {props.data.meta.current_page} / {props.data.meta.last_page}</small>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              disabled={props.page <= 1}
              onClick={() => props.onPage(props.page - 1)}
              className="button button-outline"
            >
              Sebelumnya
            </button>
            <button
              disabled={props.page >= props.data.meta.last_page}
              onClick={() => props.onPage(props.page + 1)}
              className="button button-outline"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
