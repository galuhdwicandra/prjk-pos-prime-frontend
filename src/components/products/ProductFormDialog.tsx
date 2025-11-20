// src/components/products/ProductFormDialog.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { Product, ProductCreatePayload, ProductUpdatePayload } from "../../types/product";

type Props = {
  open: boolean;
  initial?: Product | null;
  categories: Array<{ id: number; nama: string }>;
  onClose: () => void;
  onSubmit: (payload: ProductCreatePayload | ProductUpdatePayload) => Promise<boolean>;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function ProductFormDialog({ open, initial, categories, onClose, onSubmit }: Props) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<ProductCreatePayload>({
    category_id: initial?.category_id ?? (categories[0]?.id ?? 0),
    nama: initial?.nama ?? "",
    slug: initial?.slug ?? "",
    deskripsi: initial?.deskripsi ?? "",
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        category_id: initial?.category_id ?? (categories[0]?.id ?? 0),
        nama: initial?.nama ?? "",
        slug: initial?.slug ?? "",
        deskripsi: initial?.deskripsi ?? "",
        is_active: initial?.is_active ?? true,
      });
      setErr(null);
    }
  }, [open, initial, categories]);

  const autoSlug = useMemo(() => (form.nama ? slugify(form.nama) : ""), [form.nama]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const payload: ProductCreatePayload | ProductUpdatePayload = {
      category_id: form.category_id,
      nama: form.nama.trim(),
      slug: (form.slug && form.slug.trim()) || autoSlug,
      deskripsi: form.deskripsi || null,
      is_active: form.is_active,
    };
    const ok = await onSubmit(payload).catch((e) => {
      setErr(e?.message || "Gagal menyimpan.");
      return false;
    });
    setSaving(false);
    if (ok) onClose();
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
      // overlay tanpa tambah kelas baru (supaya patuh aturanmu)
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
      }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          width: "100%",
          maxWidth: 720,
          padding: 16,
          cursor: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row row--between" style={{ marginBottom: 8 }}>
          <div id="product-form-title" className="title-sm">
            {isEdit ? "Edit Produk" : "Tambah Produk"}
          </div>
          <button type="button" className="button" onClick={onClose}>
            Tutup
          </button>
        </div>

        {/* Form grid sederhana pakai utilitas index.css */}
        <div className="form-row form-row--2" style={{ marginTop: 8 }}>
          <label className="form-field">
            <span className="label">Kategori</span>
            <select
              className="select"
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: Number(e.target.value) }))}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span className="label">Nama</span>
            <input
              className="input"
              value={form.nama}
              onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
              required
            />
          </label>
        </div>

        <div className="form-row">
          <label className="form-field" style={{ width: "100%" }}>
            <span className="label">Slug</span>
            <input
              className="input"
              placeholder={autoSlug}
              value={form.slug ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
            <span className="help-text">Kosongkan untuk otomatis: {autoSlug || "-"}</span>
          </label>
        </div>

        <div className="form-row">
          <label className="form-field" style={{ width: "100%" }}>
            <span className="label">Deskripsi</span>
            <textarea
              className="textarea"
              rows={3}
              value={form.deskripsi ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
            />
          </label>
        </div>

        <div className="form-row" style={{ alignItems: "center" }}>
          <label className="form-field" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={!!form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            <span>Aktif</span>
          </label>
        </div>

        {err && (
          <div className="badge badge-danger" style={{ marginTop: 8 }}>
            {err}
          </div>
        )}

        <div className="row row--end" style={{ gap: 8, marginTop: 12 }}>
          <button type="button" onClick={onClose} className="button">
            Batal
          </button>
          <button disabled={saving} className="button button-primary" aria-busy={saving}>
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
