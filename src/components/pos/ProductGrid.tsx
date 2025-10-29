// src/components/pos/ProductGrid.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product, ProductQuery } from "../../types/product";
import { listProducts } from "../../api/products";
import { ensureImageUrl } from "../../api/_files";
import { isAbortLike } from "../../utils/isAbortLike";

type Props = {
  onPick?: (p: Product) => void;
  perPage?: number;
  initialQuery?: ProductQuery;
  warehouseId?: number;
  /** Jika true, komponen tidak akan fetch sebelum warehouseId tersedia */
  requireWarehouse?: boolean;
};

type LaravelPaginator<T> = {
  data?: T[];
  current_page?: number;
  last_page?: number;
};

type JsonApiLike<T> = {
  data?: T[];
  meta?: { last_page?: number };
};

// ---------- Type-safe helpers (tanpa 'any') ----------
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}
function isString(v: unknown): v is string {
  return typeof v === "string";
}
function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
function isLaravelPaginator<T>(v: unknown): v is LaravelPaginator<T> {
  if (!isRecord(v)) return false;
  if (!("data" in v)) return false;
  return Array.isArray((v as Record<string, unknown>).data);
}
function isJsonApiLike<T>(v: unknown): v is JsonApiLike<T> {
  if (!isRecord(v)) return false;
  const meta = v.meta;
  return isRecord(meta) && typeof meta.last_page === "number";
}
function extractData<T>(v: unknown): T[] {
  if (isLaravelPaginator<T>(v)) return v.data ?? [];
  if (isJsonApiLike<T>(v)) return v.data ?? [];
  return [];
}
function extractLastPage(v: unknown): number {
  if (isJsonApiLike(v)) {
    const meta = (v as JsonApiLike<unknown>).meta;
    const lp = meta?.last_page;
    if (typeof lp === "number" && Number.isFinite(lp)) return lp;
  }
  if (isLaravelPaginator(v)) {
    const lp = (v as LaravelPaginator<unknown>).last_page;
    if (typeof lp === "number" && Number.isFinite(lp)) return lp;
  }
  return 1;
}

type ApiErrorShape = { status?: number; message?: string; errors?: unknown };

function isApiErrorShape(x: unknown): x is ApiErrorShape {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  const okStatus = !("status" in o) || typeof o.status === "number" || typeof o.status === "undefined";
  const okMessage = !("message" in o) || typeof o.message === "string" || typeof o.message === "undefined";
  return okStatus && okMessage;
}

function getErrorMessage(e: unknown, fallback = "Gagal memuat produk."): string {
  if (typeof e === "string") return e;
  if (typeof e === "object" && e !== null) {
    const o = e as Record<string, unknown>;
    const m = o["message"];
    if (typeof m === "string" && m.trim() !== "") return m;
  }
  try {
    const s = String(e);
    if (s && s !== "[object Object]") return s;
  } catch { /* ignore */ }
  return fallback;
}

// ---------- Debug helpers ----------
function hasQueryFlag(name: string): boolean {
  try {
    return new URLSearchParams(window.location.search).getAll("debug").includes(name) ||
      new URLSearchParams(window.location.search).has(name);
  } catch { return false; }
}
function isDebugOn(): boolean {
  if (import.meta.env.DEV === true) return true;
  try { if (localStorage.getItem("DEBUG_GRID") === "1") return true; } catch { /* ignore */ }
  if (hasQueryFlag("grid") || hasQueryFlag("debug") && hasQueryFlag("all")) return true;
  return false;
}
const DEBUG = isDebugOn();
function pickStatus(e: unknown): number | undefined {
  if (!isRecord(e)) return undefined;
  const resp = isRecord(e.response) ? e.response : undefined;
  const st = resp && isNumber((resp as Record<string, unknown>).status)
    ? (resp as Record<string, unknown>).status as number
    : undefined;
  if (isNumber((e as Record<string, unknown>).status)) return (e as Record<string, unknown>).status as number;
  return st;
}
function pickServerMessage(e: unknown): string | undefined {
  if (!isRecord(e)) return undefined;
  const resp = isRecord(e.response) ? e.response : undefined;
  const data = resp && isRecord((resp as Record<string, unknown>).data) ? (resp as Record<string, unknown>).data : undefined;
  const msg = data && isString((data as Record<string, unknown>).message) ? (data as Record<string, unknown>).message as string : undefined;
  return msg;
}
function debugStart(reqId: number, q: ProductQuery) {
  if (!DEBUG) return;
  const qLog = {
    page: q.page, per_page: q.per_page, sort: q.sort, is_active: q.is_active,
    gudang_id: (q as Record<string, unknown>)["gudang_id"],
    cabang_id: (q as Record<string, unknown>)["cabang_id"],
    has_search: Boolean((q as Record<string, unknown>)["search"] ?? (q as Record<string, unknown>)["q"]),
  };
  console.groupCollapsed(`[ProductGrid] ▶ request #${reqId} /products`);
  console.log("query:", qLog);
  console.groupEnd();
}
function debugSuccess(reqId: number, res: unknown, dataLen: number, lastPage: number) {
  if (!DEBUG) return;
  console.groupCollapsed(`[ProductGrid] ✅ success #${reqId} /products`);
  console.log("raw:", res);
  console.log("data.length:", dataLen, "lastPage:", lastPage);
  console.groupEnd();
}
function debugError(reqId: number, err: unknown) {
  if (!DEBUG) return;
  console.groupCollapsed(`[ProductGrid] ❌ error #${reqId} /products`);
  console.log("raw error:", err);
  console.log("status (detected):", pickStatus(err));
  console.log("server message (detected):", pickServerMessage(err));
  console.groupEnd();
}

export default function ProductGrid({
  onPick,
  perPage = 24,
  initialQuery,
  warehouseId,
  requireWarehouse = false,
}: Props) {
  const [items, setItems] = useState<Product[]>([]);
  const lastGoodRef = useRef<Product[]>([]);
  const reqSeqRef = useRef<number>(0);
  const [page, setPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const query: ProductQuery = useMemo(
    () => ({
      per_page: perPage,
      page,
      sort: "nama",
      is_active: true,
      ...(initialQuery ?? {}),
      ...(warehouseId ? { gudang_id: warehouseId } : {}),
    }),
    [page, perPage, initialQuery, warehouseId]
  );

  // Reset halaman saat filter/gudang berubah
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage, warehouseId, JSON.stringify(initialQuery ?? {})]);

  useEffect(() => {
    // Jika diwajibkan punya scope gudang, tahan fetch sampai warehouseId ada
    if (requireWarehouse && !warehouseId) {
      setItems([]);
      setLastPage(1);
      setLoading(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const myReqId = ++reqSeqRef.current;
    console.log(`[ProductGrid] fetching #${myReqId}`, { query });

    setLoading(true);
    setError(null);

    debugStart(myReqId, query);
    if (import.meta.env.DEV) console.time?.(`[ProductGrid] #${myReqId} /products`);

    listProducts(query, { signal: ac.signal })
      .then((res) => {
        if (myReqId !== reqSeqRef.current) return;
        const data = extractData<Product>(res);
        const lp = extractLastPage(res);
        setItems(data);
        lastGoodRef.current = data;
        setLastPage(lp);
        setError(null);
        debugSuccess(myReqId, res, data.length, lp);
      })
      .catch((e: unknown) => {
        if (isAbortLike(e)) return;
        if (myReqId !== reqSeqRef.current) return;
        debugError(myReqId, e);
        const msg = isApiErrorShape(e)
          ? (e.message ?? "Gagal memuat produk.")
          : getErrorMessage(e);
        if (lastGoodRef.current.length > 0) {
          setError(null);
          return;
        }
        setError(msg);
        setItems([]);
        setLastPage(1);
      })
      .finally(() => {
        if (import.meta.env.DEV) console.timeEnd?.(`[ProductGrid] #${myReqId} /products`);
        if (myReqId === reqSeqRef.current) setLoading(false);
      });

    return () => ac.abort();
  }, [query, requireWarehouse, warehouseId]);

  const showBlockingError = Boolean(error) && items.length === 0;
  if (showBlockingError) {
    return (
      <div className="card">
        <div className="alert alert-danger text-sm">
          Tidak dapat memuat produk. {error}
        </div>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="card">
        <div className="skeleton h-40" />
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">Belum ada produk aktif.</div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* GRID PRODUK */}
      <div
        className="grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "12px",
        }}
      >
        {items.map((p) => {
          const fallbackPath =
            p.media?.find((m) => m.is_primary)?.path || p.media?.[0]?.path || null;
          const img = ensureImageUrl(p.image_url ?? null, fallbackPath);

          return (
            <button
              key={p.id}
              onClick={() => onPick?.(p)}
              className="card soft hoverable"
              type="button"
              style={{ padding: "10px", textAlign: "left" }}
            >
              {/* Image ratio square tanpa Tailwind */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  paddingTop: "100%", // 1:1
                  overflow: "hidden",
                  borderRadius: "8px",
                  background: "var(--color-muted-bg, #f6f6f6)",
                }}
              >
                {img ? (
                  <img
                    src={img}
                    alt={p.nama}
                    loading="eager"
                    decoding="async"
                    onError={(e) => { e.currentTarget.src = "/no-image.svg"; }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: "translateZ(0)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      fontSize: "12px",
                      opacity: 0.6,
                    }}
                  >
                    No Image
                  </div>
                )}
              </div>

              <div style={{ marginTop: "8px" }}>
                <div className="text-sm clamp-2" style={{ fontWeight: 600 }}>
                  {p.nama}
                </div>
                {Array.isArray(p.variants) && p.variants.length > 0 && (
                  <div className="muted text-xs" style={{ marginTop: "4px" }}>
                    Rp
                    {Math.min(
                      ...p.variants.map((v) => Number(v.harga ?? 0))
                    ).toLocaleString("id-ID")}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* PAGINATION */}
      <div className="table-footer" style={{ marginTop: "12px" }}>
        <div className="muted text-sm">Hal. {page} / {lastPage}</div>
        <div className="btn-group">
          <button
            className="button button-outline"
            onClick={() => setPage((curr) => Math.max(1, curr - 1))}
            disabled={page <= 1}
            type="button"
          >
            ← Sebelumnya
          </button>
          <button
            className="button button-outline"
            onClick={() => setPage((curr) => Math.min(lastPage, curr + 1))}
            disabled={page >= lastPage}
            type="button"
          >
            Selanjutnya →
          </button>
        </div>
      </div>

      {error && items.length > 0 && (
        <div className="alert alert-warning text-xs" style={{ marginTop: "8px" }}>
          Terjadi kendala sementara: {error}
        </div>
      )}
    </div>
  );
}
