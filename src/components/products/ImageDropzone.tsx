// src/components/products/ImageDropzone.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductMedia } from "../../types/product";
import { deleteMedia, listMedia, setPrimaryMedia, uploadMedia } from "../../api/products";

type Props = { productId: number };

/* =========================
   Helpers ENV & URL (tanpa `as any`)
   ========================= */
function getEnvStr(v: unknown): string { return typeof v === "string" ? v : ""; }
/** Hilangkan trailing slash */
function rtrimSlash(s: string): string { return s.replace(/\/+$/, ""); }
/** Ambil origin backend dari VITE_API_URL / VITE_API_BASE_URL, buang /api(/vX)? */
function getApiOrigin(): string {
  const ENV = import.meta.env;
  const rawBase = getEnvStr(ENV.VITE_API_URL) || getEnvStr(ENV.VITE_API_BASE_URL) || "";
  const trimmed = rtrimSlash(rawBase);
  const noApi = trimmed.replace(/\/api(\/v\d+)?$/i, "");
  try { if (noApi) return new URL(noApi).origin; } catch { /* noop */ }
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
const API_ORIGIN = getApiOrigin();
/** Bangun URL absolut untuk media product */
function resolveMediaUrl(m: ProductMedia): string {
  const direct = m.thumb_url || m.url;
  if (direct) {
    if (/^https?:\/\//i.test(direct)) return direct;
    return `${API_ORIGIN}${direct.startsWith("/") ? "" : "/"}${direct}`;
  }
  const path = m.path ? `/storage/${m.path}` : "";
  if (!path) return "";
  return `${API_ORIGIN}${path}`;
}

/* =========================
   Komponen
   ========================= */
export default function ImageDropzone({ productId }: Props) {
  const [rows, setRows] = useState<ProductMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await listMedia(productId)
        .then((rows) => setRows(rows))
        .catch((e) => setError(e?.message || "Gagal memuat media."))
        .finally(() => setLoading(false));
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? "Gagal memuat media.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { void refresh(); }, [refresh]);

  type ApiErr = { message?: string; errors?: Record<string, string[]> };
  const renderErrors = useCallback((e: ApiErr | null): string | null => {
    if (!e) return null;
    if (e.errors && Object.keys(e.errors).length) {
      const arr = Object.entries(e.errors).flatMap(([k, v]) => (v ?? []).map((msg) => `${k}: ${msg}`));
      return arr.join("\n");
    }
    return e.message ?? null;
  }, []);

  const onFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      if (import.meta.env.DEV) {
        console.log("[ImageDropzone] files:", files.map(f => ({ name: f.name, type: f.type, size: f.size })));
      }
      const MAX_MB = 5;
      const bad = files.find((f) => !f.type.startsWith("image/") || f.size > MAX_MB * 1024 * 1024);
      if (bad) {
        setError(!bad.type.startsWith("image/") ? "File harus berupa gambar." : `Ukuran gambar maksimal ${MAX_MB}MB per file.`);
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await uploadMedia(productId, files);
        await refresh();
      } catch (e) {
        const api = e as ApiErr;
        setError(renderErrors(api) ?? "Gagal upload media.");
      } finally {
        setBusy(false);
      }
    },
    [productId, refresh, renderErrors]
  );

  function handleBrowse() { ref.current?.click(); }

  const makePrimary = useCallback(
    async (m: ProductMedia) => {
      setBusy(true);
      try { await setPrimaryMedia(productId, m.id); await refresh(); }
      catch (e) { setError((e as { message?: string })?.message ?? "Gagal set primary."); }
      finally { setBusy(false); }
    },
    [productId, refresh]
  );

  const removeItem = useCallback(
    async (m: ProductMedia) => {
      if (!confirm("Hapus gambar ini?")) return;
      setBusy(true);
      try { await deleteMedia(productId, m.id); await refresh(); }
      catch (e) { setError((e as { message?: string })?.message ?? "Gagal menghapus media."); }
      finally { setBusy(false); }
    },
    [productId, refresh]
  );

  return (
    <div className="section">
      {/* Dropzone */}
      <div
        className={`card ${busy ? "opacity-50" : ""}`}
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => {
          e.preventDefault();
          const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
          void onFiles(files);
        }}
        onClick={handleBrowse}
        role="button"
        tabIndex={0}
        // styling minimal agar sesuai UI-UX (tanpa menambah index.css)
        style={{
          border: "2px dashed rgba(0,0,0,.15)",
          textAlign: "center",
          cursor: "pointer",
          padding: "var(--space-5)",
          background: "var(--color-surface)"
        }}
      >
        <input
          ref={ref}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            void onFiles(files);
            e.currentTarget.value = "";
          }}
          style={{ display: "none" }}
        />
        <div className="mb-1" style={{ fontWeight: 600 }}>Tarik & letakkan gambar di sini</div>
        <div className="text-dim" style={{ fontSize: ".9rem" }}>atau klik untuk memilih file</div>
      </div>

      {/* List */}
      {loading ? (
        <div className="card">Memuat…</div>
      ) : (rows?.length ?? 0) === 0 ? (
        <div className="card text-dim" style={{ fontSize: ".9rem" }}>Belum ada media.</div>
      ) : (
        <div className="form-row form-row--3">
          {(rows ?? []).map((m) => (
            <div key={m.id} className="card">
              <img
                src={resolveMediaUrl(m)}
                alt=""
                loading="lazy"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  if (!el.dataset.fallback && m.path) {
                    el.dataset.fallback = "1";
                    el.src = `/storage/${m.path}`;
                  }
                }}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  borderRadius: "calc(var(--radius-lg) - 2px)"
                }}
              />
              {/* info + actions */}
              <div className="mt-2">
                {m.is_primary && <span className="badge badge-success">Primary</span>}
              </div>
              <div className="mt-2">
                <button
                  className="button"
                  disabled={busy || m.is_primary}
                  onClick={() => void makePrimary(m)}
                >
                  Jadikan utama
                </button>
                <button
                  className="button button-outline mt-2"
                  disabled={busy}
                  onClick={() => void removeItem(m)}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="card" style={{ borderColor: "rgba(192,70,87,.35)" }}>
          <pre className="text-dim" style={{ whiteSpace: "pre-wrap" }}>{error}</pre>
        </div>
      )}
    </div>
  );
}
