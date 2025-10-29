// src/pages/products/ProductsPage.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import type { Product, ProductQuery, ProductCreatePayload, ProductUpdatePayload } from "../../types/product";
import { createProduct, deleteProduct, listProducts, updateProduct } from "../../api/products";

// Jika kamu sudah punya API & types kategori, import saja seperti ini (sesuaikan path proyekmu):
import { listCategories } from "../../api/categories";
import type { Category } from "../../types/category";

import ProductFilters from "../../components/products/ProductFilters";
import ProductTable from "../../components/products/ProductTable";
import ProductFormDialog from "../../components/products/ProductFormDialog";
import VariantManager from "../../components/products/VariantManager";
import ImageDropzone from "../../components/products/ImageDropzone";

type CategoryLite = Pick<Category, "id" | "nama">;

export default function ProductsPage() {
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [query, setQuery] = useState<ProductQuery>({ page: 1, per_page: 10, sort: "-created_at" });
  const [rows, setRows] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [variantsFor, setVariantsFor] = useState<Product | null>(null);
  const [mediaFor, setMediaFor] = useState<Product | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await listProducts(query);
      setRows(r.data);
      setTotal(r.meta?.total ?? r.data.length);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    (async () => {
      try {
        const r = await listCategories({ page: 1, per_page: 100 });
        setCategories(r.data.map((c: Category) => ({ id: c.id, nama: c.nama })));
      } catch {
        // diamkan; filter kategori tetap bisa jalan dengan opsi default "Semua"
      }
    })();
  }, []);

  const page = useMemo(() => query.page ?? 1, [query]);
  const perPage = useMemo(() => query.per_page ?? 10, [query]);

  async function handleSubmit(payload: ProductCreatePayload | ProductUpdatePayload) {
    if (editing?.id) {
      await updateProduct(editing.id, payload);
    } else {
      await createProduct(payload as ProductCreatePayload);
    }
    await refresh();
    return true;
  }

  function onDelete(row: Product) {
    if (!confirm(`Hapus produk "${row.nama}"?`)) return;
    deleteProduct(row.id).then(refresh);
  }

  return (
    <div className="page page--stack">
      {/* Header */}
      <div className="page-header row row--between">
        <h1 className="page-title">Produk</h1>
        <button
          className="button button-primary"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Tambah Produk
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <ProductFilters value={query} categories={categories} onChange={setQuery} />
      </div>

      {/* Table */}
      <div className="card">
        <ProductTable
          rows={rows}
          loading={loading}
          page={page}
          perPage={perPage}
          total={total}
          onPageChange={(p) => setQuery((q) => ({ ...q, page: p }))}
          onEdit={(r) => {
            setEditing(r);
            setDialogOpen(true);
          }}
          onVariants={(r) => setVariantsFor(r)}
          onMedia={(r) => setMediaFor(r)}
          onDelete={onDelete}
        />
      </div>

      {/* Variants Dialog */}
      {variantsFor && (
        <div className="dialog is-open" role="dialog" aria-modal="true">
          <div className="dialog__overlay" onClick={() => setVariantsFor(null)} />
          <div className="dialog__content card card--lg">
            <div className="row row--between">
              <div className="title-sm">Varian — {variantsFor.nama}</div>
              <button className="button" onClick={() => setVariantsFor(null)}>Tutup</button>
            </div>
            <VariantManager productId={variantsFor.id} />
          </div>
        </div>
      )}

      {/* Media Dialog */}
      {mediaFor && (
        <div className="dialog is-open" role="dialog" aria-modal="true">
          <div className="dialog__overlay" onClick={() => setMediaFor(null)} />
          <div className="dialog__content card card--lg">
            <div className="row row--between">
              <div className="title-sm">Media — {mediaFor.nama}</div>
              <button className="button" onClick={() => setMediaFor(null)}>Tutup</button>
            </div>
            <ImageDropzone productId={mediaFor.id} />
          </div>
        </div>
      )}

      {/* Create/Update Dialog */}
      <ProductFormDialog
        open={dialogOpen}
        initial={editing}
        categories={categories}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
