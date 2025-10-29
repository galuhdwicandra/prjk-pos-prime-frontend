// src/pages/ProductDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import type { Product } from "../../types/product";
import { getProduct, updateProduct, deleteProduct } from "../../api/products";
import VariantManager from "../../components/products/VariantManager";
import ImageDropzone from "../../components/products/ImageDropzone";

type TabKey = "info" | "variant-stock";

type HttpErrorShape = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
      [k: string]: unknown;
    };
  };
};

function getErrorMessage(err: unknown, fallback = "Terjadi kesalahan."): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const e = err as HttpErrorShape;
    return e.response?.data?.message || e.message || fallback;
  }
  return fallback;
}

function getStatus(err: unknown): number | undefined {
  if (err && typeof err === "object") {
    const e = err as HttpErrorShape;
    return e.response?.status;
  }
  return undefined;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function isPositiveInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n > 0;
}

export default function ProductDetail(): React.ReactElement {
  const { id: rawId } = useParams();
  const navigate = useNavigate();
  const id = Number(rawId);

  const [tab, setTab] = useState<TabKey>("info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [row, setRow] = useState<Product | null>(null);

  const autoSlug = useMemo(() => (row?.nama ? slugify(row.nama) : ""), [row?.nama]);

  async function refresh(): Promise<void> {
    if (!isPositiveInt(id)) {
      setRow(null);
      setErr("Parameter ID tidak valid.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const product = await getProduct(id);
      setRow(product);
    } catch (e: unknown) {
      const status = getStatus(e);
      const msg = status === 404 ? "Produk tidak ditemukan (404)." : getErrorMessage(e, "Gagal memuat produk.");
      setRow(null);
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSaveInfo(): Promise<void> {
    if (!row) return;
    setSaving(true);
    setErr(null);
    try {
      await updateProduct(row.id, {
        category_id: row.category_id,
        nama: row.nama.trim(),
        slug: row.slug?.trim() || autoSlug,
        deskripsi: row.deskripsi ?? null,
        is_active: row.is_active,
      });
      await refresh();
    } catch (e: unknown) {
      setErr(getErrorMessage(e, "Gagal menyimpan."));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(): Promise<void> {
    if (!row) return;
    if (!confirm(`Hapus produk "${row.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await deleteProduct(row.id);
      navigate("/catalog/products");
    } catch (e: unknown) {
      alert(getErrorMessage(e, "Gagal menghapus produk."));
    }
  }

  if (loading) return <div className="card">Memuat produk…</div>;

  if (err) {
    return (
      <div className="card stack stack--sm">
        <div className="text-danger">{err}</div>
        <div>
          <NavLink to="/catalog/products" className="link">
            ← Kembali ke daftar produk
          </NavLink>
        </div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="card stack stack--sm">
        <div>Produk tidak ditemukan.</div>
        <div>
          <NavLink to="/catalog/products" className="link">
            ← Kembali ke daftar produk
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--stack">
      {/* Header */}
      <div className="page-header row row--between">
        <div className="stack stack--xs">
          <div className="muted">
            <NavLink to="/catalog/products" className="link">Produk</NavLink> / Detail
          </div>
          <h1 className="page-title">{row.nama}</h1>
        </div>
        <button className="button" onClick={onDelete}>Hapus</button>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="row row--gap-sm">
          <button
            className={tab === "info" ? "button button-primary" : "button"}
            onClick={() => setTab("info")}
            type="button"
          >
            Info
          </button>
          <button
            className={tab === "variant-stock" ? "button button-primary" : "button"}
            onClick={() => setTab("variant-stock")}
            type="button"
          >
            Varian &amp; Stok
          </button>
        </div>
      </div>

      {tab === "info" ? (
        <div className="card stack stack--sm">
          <label className="stack stack--xs">
            <span className="label">Nama</span>
            <input
              className="input"
              value={row.nama}
              onChange={(e) => setRow({ ...(row as Product), nama: e.target.value })}
            />
          </label>

          <label className="stack stack--xs">
            <span className="label">Slug</span>
            <input
              className="input"
              placeholder={autoSlug}
              value={row.slug ?? ""}
              onChange={(e) => setRow({ ...(row as Product), slug: e.target.value })}
            />
            <span className="help muted">Kosongkan untuk otomatis: {autoSlug || "-"}</span>
          </label>

          <label className="stack stack--xs">
            <span className="label">Deskripsi</span>
            <textarea
              className="textarea"
              rows={3}
              value={row.deskripsi ?? ""}
              onChange={(e) => setRow({ ...(row as Product), deskripsi: e.target.value })}
            />
          </label>

          <label className="row row--gap-xs">
            <input
              type="checkbox"
              checked={!!row.is_active}
              onChange={(e) => setRow({ ...(row as Product), is_active: e.target.checked })}
            />
            <span>Aktif</span>
          </label>

          {err && <div className="alert alert-danger">{err}</div>}

          <div className="row row--end row--gap-sm">
            <button className="button" onClick={() => void refresh()} disabled={saving}>Reset</button>
            <button
              className="button button-primary"
              onClick={() => void onSaveInfo()}
              disabled={saving}
            >
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </div>
      ) : (
        <div className="page-section stack stack--md">
          <div className="card">
            <VariantManager productId={row.id} />
          </div>
          <div className="card stack stack--sm">
            <div className="title-sm">Media Gambar</div>
            <ImageDropzone productId={row.id} />
          </div>
        </div>
      )}
    </div>
  );
}
