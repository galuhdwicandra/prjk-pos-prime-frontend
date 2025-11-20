// src/pages/master/Warehouses.tsx
import React, { useMemo, useState } from "react";
import { useWarehouses } from "../../store/useWarehouses";
import WarehouseFilters from "../../components/warehouses/WarehouseFilters";
import WarehouseFormDialog from "../../components/warehouses/WarehouseFormDialog";
import WarehouseTable from "../../components/warehouses/WarehouseTable";
import type { Warehouse, WarehouseCreatePayload, WarehouseQuery } from "../../types/warehouse";
import RequireRole from "../../components/routing/RequireRole";

export default function WarehousesPage(): React.ReactElement {
  const url = new URL(window.location.href);
  const cabangFromUrl = url.searchParams.get("cabang_id");
  const initialCabang = cabangFromUrl ? Number(cabangFromUrl) : undefined;

  // fetch otomatis berdasarkan cabang_id awal
  const { items, loading, error, query, fetchList, create, update, remove, pagination } =
    useWarehouses({ cabang_id: initialCabang });

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);

  const title = useMemo(() => "Gudang", []);

  const submit = async (payload: WarehouseCreatePayload): Promise<boolean> => {
    const ok = editing ? await update(editing.id, payload) : await create(payload);
    if (ok) {
      setOpenForm(false);
      setEditing(null);
    }
    return ok;
  };

  return (
    <RequireRole roles={["superadmin", "admin_cabang", "gudang"]}>
      <div className="page"> {/* gunakan wrapper umum; tidak memengaruhi logika */}
        {/* Header */}
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 className="card-title">{title}</h1>
          <button
            className="button button-primary"
            onClick={() => {
              setEditing(null);
              setOpenForm(true);
            }}
          >
            Tambah
          </button>
        </div>

        {/* Filters */}
        <div className="card">
          <WarehouseFilters
            value={query as WarehouseQuery}
            onChange={(next) => fetchList(next)}
            onSearch={() => fetchList()}
          />
        </div>

        {/* Error / Loading / Table */}
        {error && (
          <div className="card" role="alert">
            <span className="badge badge-danger" style={{ marginRight: 8 }}>Error</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="card">
            <div className="loading">Memuat…</div>
          </div>
        ) : (
          <div className="card">
            <WarehouseTable
              items={items}
              onEdit={(row) => {
                setEditing(row);
                setOpenForm(true);
              }}
              onDelete={(row) => {
                if (confirm(`Hapus gudang "${row.nama}"?`)) {
                  void remove(row.id);
                }
              }}
            />
          </div>
        )}

        {/* Pagination */}
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="muted">
            Halaman {pagination.page} / {pagination.last_page} • Total {pagination.total}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="button"
              onClick={() => pagination.setPage(Math.max(1, pagination.page - 1))}
            >
              Sebelumnya
            </button>
            <button
              className="button"
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
        <WarehouseFormDialog
          open={openForm}
          initial={editing ?? undefined}
          defaultCabangId={initialCabang}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          onSubmit={submit}
        />
      </div>
    </RequireRole>
  );
}
