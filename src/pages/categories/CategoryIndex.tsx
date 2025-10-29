// src/pages/categories/CategoryIndex.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Category,
  CategoryCreatePayload,
  CategoryQuery,
  CategoryUpdatePayload,
  PaginatedResponse,
  ApiError,
} from "../../types/category";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/categories";
import CategoryFilters from "../../components/category/CategoryFilters";
import CategoryFormDialog from "../../components/category/CategoryFormDialog";
import CategoryTable from "../../components/category/CategoryTable";

function usePagination(total: number, perPage: number, current: number) {
  const pages = Math.max(1, Math.ceil(total / Math.max(1, perPage)));
  const clamped = Math.min(Math.max(1, current), pages);

  const items = useMemo(() => {
    const arr: number[] = [];
    let start = Math.max(1, clamped - 2);
    const end = Math.min(pages, start + 4);
    start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [pages, clamped]);

  return { pages, current: clamped, items };
}

function isApiError(e: unknown): e is ApiError {
  return typeof e === "object" && e !== null && "status" in e && "message" in e;
}

export default function CategoryIndex(): React.ReactElement {
  const [query, setQuery] = useState<CategoryQuery>({
    page: 1,
    per_page: 10,
    sort: "nama",
  });
  const [rows, setRows] = useState<Category[]>([]);
  const [meta, setMeta] = useState<{
    total: number;
    last_page: number;
    current_page: number;
    per_page: number;
  }>({
    total: 0,
    last_page: 1,
    current_page: 1,
    per_page: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openForm, setOpenForm] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);

  const { items: pageItems, current } = usePagination(
    meta.total,
    meta.per_page,
    meta.current_page
  );

  const fetchData = useCallback(
    async (q: CategoryQuery = query) => {
      setLoading(true);
      setError(null);
      try {
        const res: PaginatedResponse<Category> = await listCategories(q);
        setRows(res.data);
        setMeta(res.meta);
      } catch (e: unknown) {
        setError(isApiError(e) ? e.message : "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData(query);
  }, [query, fetchData]);

  const openCreate = () => {
    setEditItem(null);
    setOpenForm(true);
  };
  const openEdit = (row: Category) => {
    setEditItem(row);
    setOpenForm(true);
  };

  const handleSubmit = async (
    payload: CategoryCreatePayload | CategoryUpdatePayload
  ): Promise<boolean> => {
    if (editItem) {
      await updateCategory(editItem.id, payload as CategoryUpdatePayload);
    } else {
      await createCategory(payload as CategoryCreatePayload);
    }
    await fetchData(query);
    return true;
  };

  const handleDelete = async (row: Category) => {
    const ok = window.confirm(
      `Hapus kategori "${row.nama}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!ok) return;

    try {
      await deleteCategory(row.id);
      if (rows.length === 1 && meta.current_page > 1) {
        setQuery({ ...query, page: (query.page ?? 1) - 1 });
      } else {
        await fetchData(query);
      }
    } catch (e: unknown) {
      const msg = isApiError(e) ? e.message : "Gagal menghapus";
      alert(msg);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="card" style={{ padding: 16 }}>
        <div
          className="header-bar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 className="h1" style={{ margin: 0 }}>Kategori</h1>
            <div className="muted">Kelola kategori produk (multi-cabang & siap POS).</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              className="select"
              value={query.per_page ?? 10}
              onChange={(e) =>
                setQuery({
                  ...query,
                  per_page: Number(e.target.value),
                  page: 1,
                })
              }
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / halaman
                </option>
              ))}
            </select>
            <button className="button button-primary" onClick={openCreate}>
              + Tambah
            </button>
          </div>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <CategoryFilters value={query} onChange={setQuery} />
        </div>

        <div>
          {loading ? (
            <div className="empty" style={{ padding: 24, textAlign: "center" }}>
              Memuat…
            </div>
          ) : error ? (
            <div
              className="alert alert-danger"
              style={{ padding: 16, textAlign: "center" }}
            >
              {error}
            </div>
          ) : rows.length === 0 ? (
            <div className="empty" style={{ padding: 24, textAlign: "center" }}>
              Belum ada data kategori.
            </div>
          ) : (
            <CategoryTable rows={rows} onEdit={openEdit} onDelete={handleDelete} />
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="card" style={{ padding: 12 }}>
        <div
          className="pagination-bar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div className="muted" style={{ fontSize: 14 }}>
            Halaman {meta.current_page} dari {meta.last_page} • Total {meta.total} data
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="button"
              disabled={current <= 1}
              onClick={() =>
                setQuery({ ...query, page: Math.max(1, (query.page ?? 1) - 1) })
              }
            >
              Prev
            </button>
            {pageItems.map((p) => (
              <button
                key={p}
                className={`button${p === meta.current_page ? " button-primary" : ""}`}
                onClick={() => setQuery({ ...query, page: p })}
              >
                {p}
              </button>
            ))}
            <button
              className="button"
              disabled={current >= meta.last_page}
              onClick={() =>
                setQuery({
                  ...query,
                  page: Math.min(meta.last_page, (query.page ?? 1) + 1),
                })
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <CategoryFormDialog
        open={openForm}
        initial={editItem}
        onClose={() => setOpenForm(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
