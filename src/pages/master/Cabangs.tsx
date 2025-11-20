import React, { useMemo, useState } from "react";
import { useBranches } from "../../store/useBranches";
import BranchFilters from "../../components/cabangs/BranchFilters";
import BranchFormDialog from "../../components/cabangs/BranchFormDialog";
import BranchTable from "../../components/cabangs/BranchTable";
import type { Branch, BranchCreatePayload, BranchQuery } from "../../types/branch";
import RequireRole from "../../components/routing/RequireRole";

export default function CabangsPage(): React.ReactElement {
  const { items, loading, error, query, fetchList, create, update, remove, pagination } = useBranches();
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);

  const title = useMemo(() => "Cabang", []);

  const submit = async (payload: BranchCreatePayload): Promise<boolean> => {
    const ok = editing ? await update(editing.id, payload) : await create(payload);
    if (ok) {
      setOpenForm(false);
      setEditing(null);
    }
    return ok;
  };

  return (
    <RequireRole roles={["superadmin", "admin_cabang"]}>
      <div className="page">
        {/* Header / Toolbar */}
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 className="h1">{title}</h1>
          <button
            className="button button-primary"
            onClick={() => { setEditing(null); setOpenForm(true); }}
          >
            Tambah
          </button>
        </div>

        {/* Filters */}
        <div className="card">
          <BranchFilters
            value={query as BranchQuery}
            onChange={(next) => fetchList(next)}
            onSearch={() => fetchList()}
          />
        </div>

        {/* Error / Loading / Table */}
        {error && (
          <div className="card" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span className="badge badge-danger">Error</span>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="card text-sm">Memuat…</div>
        ) : (
          <div className="card">
            <BranchTable
              items={items}
              onEdit={(row) => { setEditing(row); setOpenForm(true); }}
              onDelete={(row) => {
                if (confirm(`Hapus cabang "${row.nama}"?`)) {
                  void remove(row.id);
                }
              }}
              onOpenGudang={(row) => { window.location.href = `/master/warehouses?cabang_id=${row.id}`; }}
            />
          </div>
        )}

        {/* Pagination */}
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="text-sm">
            Halaman {pagination.page} / {pagination.last_page} • Total {pagination.total}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="button button-outline"
              onClick={() => pagination.setPage(Math.max(1, pagination.page - 1))}
            >
              Sebelumnya
            </button>
            <button
              className="button button-outline"
              onClick={() => pagination.setPage(Math.min(pagination.last_page, pagination.page + 1))}
            >
              Berikutnya
            </button>
            <select
              className="select"
              value={pagination.per_page}
              onChange={(e) => pagination.setPerPage(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Form Dialog */}
        <BranchFormDialog
          open={openForm}
          initial={editing ?? undefined}
          onClose={() => { setOpenForm(false); setEditing(null); }}
          onSubmit={submit}
        />
      </div>
    </RequireRole>
  );
}
