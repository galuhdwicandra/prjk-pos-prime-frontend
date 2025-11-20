// src/components/category/CategoryFormDialog.tsx
import React, { useEffect, useState } from "react";
import type { Category, CategoryCreatePayload, CategoryUpdatePayload } from "../../types/category";
import { slugify } from "../../lib/slug";

type Props = {
  open: boolean;
  initial?: Category | null;
  onClose: () => void;
  onSubmit: (payload: CategoryCreatePayload | CategoryUpdatePayload) => Promise<boolean>;
};

export default function CategoryFormDialog({ open, initial, onClose, onSubmit }: Props) {
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
    if (open) {
      setNama(initial?.nama ?? "");
      setDeskripsi(initial?.deskripsi ?? "");
      setIsActive(initial?.is_active ?? true);
      setErrors(null);
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors(null);

    const nextSlug =
      initial && initial.nama.trim() === nama.trim()
        ? initial.slug
        : slugify(nama);

    const payload: CategoryCreatePayload | CategoryUpdatePayload = initial
      ? { nama, deskripsi: deskripsi || null, is_active: isActive, slug: nextSlug }
      : { nama, deskripsi, is_active: isActive, slug: nextSlug };

    try {
      const ok = await onSubmit(payload);
      if (ok) onClose();
    } catch (err) {
      const e = err as { status?: number; message?: string; errors?: Record<string, string[]> };
      if (e?.errors) setErrors(e.errors);
      else setErrors({ _error: [e?.message ?? "Gagal menyimpan."] });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.4)",
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 640,
          background: "#fff",
          borderRadius: 16,
          border: "1px solid var(--border, #e5e7eb)",
          boxShadow: "var(--shadow-md, 0 4px 16px rgba(0,0,0,0.08))",
        }}
      >
        <div
          className="card-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border, #e5e7eb)",
          }}
        >
          <h3 className="h3" style={{ margin: 0 }}>
            {initial ? "Edit Kategori" : "Tambah Kategori"}
          </h3>
          <button
            type="button"
            className="button button-ghost"
            onClick={onClose}
            aria-label="Tutup dialog"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <div className="form-row">
            <label className="label" htmlFor="nama">
              Nama<span style={{ color: "#DC2626" }}>*</span>
            </label>
            <input
              id="nama"
              className="input"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
            />
            {errors?.nama && (
              <div className="form-error" style={{ color: "#DC2626", fontSize: 12, marginTop: 6 }}>
                {errors.nama.join(", ")}
              </div>
            )}
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <label className="label" htmlFor="deskripsi">Deskripsi</label>
            <textarea
              id="deskripsi"
              className="textarea"
              rows={3}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
            />
            {errors?.deskripsi && (
              <div className="form-error" style={{ color: "#DC2626", fontSize: 12, marginTop: 6 }}>
                {errors.deskripsi.join(", ")}
              </div>
            )}
          </div>

          <div
            className="form-row"
            style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}
          >
            <input
              id="is_active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="is_active" className="label" style={{ margin: 0 }}>
              Aktif
            </label>
          </div>

          {errors?._error && (
            <div
              className="alert alert-danger"
              style={{ marginTop: 12 }}
              role="alert"
            >
              {errors._error.join(", ")}
            </div>
          )}

          <div
            className="dialog-actions"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 16,
            }}
          >
            <button type="button" className="button" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="button button-primary" disabled={submitting}>
              {submitting ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
