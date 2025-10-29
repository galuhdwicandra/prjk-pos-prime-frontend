// src/components/pos/ProductSearch.tsx
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CartItem } from "../../types/pos";
import { useCart } from "../../store/cart";
import { getAuthToken, getBaseUrl } from "../../api/client";
import { mediaPathToUrl } from "../../api/_files";
import { isAbortLike } from "../../utils/isAbortLike";

/* ====================== Types ====================== */

type VariantSummary = {
  id: number;
  name: string;
  harga: number;
  sku: string;
  barcode?: string | null;

  // optional image fields from backend
  product_id?: number;
  image_url?: string | null;  // absolute URL
  media_path?: string | null; // relative path (e.g. 'products/2/xxx.jpg')
};

type Props = { warehouseId: number };

type VariantsEnvelope = {
  data?: Array<{
    id: number;
    full_name?: string;
    nama?: string;
    sku: string;
    barcode?: string | null;
    harga: number;
    product_id?: number;
    image_url?: string | null;
    media_path?: string | null;
  }>;
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
  };
  total?: number;
  current_page?: number;
  last_page?: number;
};

/* ================== Module-scope utils ================== */

function isLikelyBarcode(s: string): boolean {
  return /^\d{6,}$/.test((s ?? "").trim());
}

/** Prefer backend-computed absolute URL; fallback to /storage/<media_path> */
function pickImageUrl(src: {
  image_url?: string | null;
  media_path?: string | null;
}): string | null {
  if (src.image_url) return src.image_url;
  return mediaPathToUrl(src.media_path);
}

/** Map backend payload (variants) into VariantSummary[] */
function mapResponse(json: VariantsEnvelope): VariantSummary[] {
  const arr = Array.isArray(json?.data) ? json.data : [];
  return arr.map((v) => ({
    id: v.id,
    name: v.full_name ?? v.nama ?? v.sku,
    harga: v.harga,
    sku: v.sku,
    barcode: v.barcode ?? null,
    product_id: v.product_id,
    image_url: pickImageUrl(v),
    media_path: v.media_path ?? null,
  }));
}

/** ✅ Safe BASE resolver */
const BASE = getBaseUrl();

/* ====================== Component ====================== */

export default function ProductSearch({ warehouseId }: Props) {
  const [q, setQ] = useState<string>("");
  const [items, setItems] = useState<VariantSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // pagination / infinite scroll
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const perPageDefault = 24; // tampilkan banyak item di awal

  const lastGoodItemsRef = useRef<VariantSummary[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reqSeqRef = useRef<number>(0);
  const debounceRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);
  const didInitRef = useRef<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const add = useCart((s) => s.add);

  /* =========== Mount / Unmount =========== */
  useEffect(() => {
    if (import.meta.env.DEV) {
      if (didInitRef.current) return;
      didInitRef.current = true;
    }
    mountedRef.current = true;
    try {
      inputRef.current?.focus();
    } catch {
      /* ignore */
    }
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  /* =========== Core fetcher with pagination =========== */
  const fetchPage = useCallback(
    async (term: string, pageToLoad: number): Promise<{ list: VariantSummary[]; lastPage: number }> => {
      if (!warehouseId) return { list: [], lastPage: 1 };

      const myReqId = ++reqSeqRef.current;

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      if (mountedRef.current) {
        setLoading(true);
        setErrorText(null);
      }

      try {
        let url: URL;
        try {
          url = new URL(`${BASE}/variants`);
        } catch {
          throw new Error(
            `Konfigurasi API tidak valid. BASE="${BASE}". Set VITE_API_URL / VITE_API_BASE_URL.`
          );
        }

        url.searchParams.set("q", term ?? "");
        url.searchParams.set("per_page", String(term.trim() === "" ? perPageDefault : 12));
        url.searchParams.set("gudang_id", String(warehouseId));
        url.searchParams.set("page", String(pageToLoad));

        const token = getAuthToken();
        const headers: Record<string, string> = { Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        let res: Response;
        try {
          res = await fetch(url.toString(), { signal: ac.signal, headers });
        } catch (err) {
          if (isAbortLike(err)) {
            return { list: [], lastPage: 1 };
          }
          throw err;
        }

        if (!res.ok) {
          let detail = "";
          try {
            const txt = await res.text();
            if (txt) detail = ` • ${txt.slice(0, 160)}`;
          } catch { /* ignore */ }
          throw new Error(`HTTP ${res.status}${detail}`);
        }

        const text = await res.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(text) as unknown;
        } catch {
          throw new Error("Response bukan JSON valid.");
        }

        if (myReqId !== reqSeqRef.current) {
          return { list: [], lastPage: 1 };
        }

        const obj: VariantsEnvelope =
          typeof parsed === "object" && parsed !== null ? (parsed as VariantsEnvelope) : {};

        const list = mapResponse(obj);
        const lastPage = obj.meta?.last_page ?? obj.last_page ?? 1;

        return { list, lastPage };
      } catch (err) {
        if (isAbortLike(err)) {
          return { list: [], lastPage: 1 };
        }
        throw err;
      } finally {
        if (mountedRef.current && reqSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [warehouseId, perPageDefault]
  );

  /* =========== Reset & initial load (show all) =========== */
  const resetAndLoad = useCallback(
    async (term: string) => {
      setPage(1);
      setHasMore(true);
      try {
        const { list, lastPage } = await fetchPage(term, 1);
        if (!mountedRef.current) return;
        setItems(list);
        lastGoodItemsRef.current = list;
        setActiveIdx(list.length ? 0 : -1);
        setHasMore(1 < lastPage);
        setErrorText(null);
      } catch (err: unknown) {
        if (isAbortLike(err)) return;
        if (!mountedRef.current) return;
        const msg =
          (typeof err === "object" && err && "message" in err && typeof (err as { message?: unknown }).message === "string")
            ? (err as { message: string }).message
            : "Gagal memuat data.";
        setErrorText(msg);
        setItems(lastGoodItemsRef.current ?? []);
      }
    },
    [fetchPage]
  );

  // initial: load semua item (term kosong)
  useEffect(() => {
    void resetAndLoad("");
  }, [resetAndLoad]);

  /* =========== Debounced search (termasuk kosong) =========== */
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    const term = q ?? "";
    const shouldSearch =
      term.trim().length === 0 ||
      term.trim().length >= 2 ||
      isLikelyBarcode(term);

    debounceRef.current = window.setTimeout(() => {
      if (shouldSearch) void resetAndLoad(term);
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q, resetAndLoad]);

  /* =========== Warehouse change re-load =========== */
  useEffect(() => {
    void resetAndLoad(q ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId]);

  /* =========== Load next page (infinite scroll) =========== */
  const loadNextPage = useCallback(async () => {
    if (loading || !hasMore) return;
    const next = page + 1;
    try {
      const { list, lastPage } = await fetchPage(q ?? "", next);
      if (!mountedRef.current) return;
      setItems((prev) => {
        const merged = [...prev, ...list];
        lastGoodItemsRef.current = merged;
        return merged;
      });
      setPage(next);
      setHasMore(next < lastPage);
      setErrorText(null);
    } catch (err: unknown) {
      if (isAbortLike(err)) return;
      if (!mountedRef.current) return;
      const msg =
        (typeof err === "object" && err && "message" in err && typeof (err as { message?: unknown }).message === "string")
          ? (err as { message: string }).message
          : "Gagal memuat data.";
      setErrorText(msg);
    }
  }, [fetchPage, hasMore, loading, page, q]);

  // IntersectionObserver untuk sentinel (infinite scroll)
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        void loadNextPage();
      }
    }, { root: listRef.current, rootMargin: "0px 0px 120px 0px" });

    io.observe(node);
    return () => io.disconnect();
  }, [loadNextPage]);

  /* =========== Add to cart =========== */
  function addToCart(v: VariantSummary): void {
    const row: CartItem = {
      variant_id: v.id,
      name: v.name,
      price_hint: v.harga,
      qty: 1,
      discount: 0,
    };
    add(row);
    setActiveIdx(-1);
    setErrorText(null);
    try {
      inputRef.current?.focus();
    } catch { /* ignore */ }
  }

  /* =========== Active item visibility =========== */
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLButtonElement>('[data-active="true"]');
    try {
      active?.scrollIntoView({ block: "nearest" });
    } catch { /* ignore */ }
  }, [activeIdx, items]);

  /* =========== Derived flags =========== */
  const showResults = useMemo(() => items.length > 0, [items]);
  const showShortHint = useMemo(
    () => !loading && !showResults && !isLikelyBarcode(q) && q.trim().length < 2,
    [loading, showResults, q]
  );
  const showNoResults = useMemo(
    () => !loading && !showResults && q.trim().length >= 2,
    [loading, showResults, q]
  );

  /* =========== Render =========== */
  return (
    <div className="w-full">
      <input
        id="pos-search"
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (!items.length) {
            if (e.key === "Enter" && isLikelyBarcode(q)) {
              e.preventDefault();
              void (async () => {
                await resetAndLoad(q);
                if (lastGoodItemsRef.current.length === 1) {
                  addToCart(lastGoodItemsRef.current[0]);
                }
              })();
            }
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((idx) => Math.min(idx + 1, items.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((idx) => Math.max(idx - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIdx >= 0 && activeIdx < items.length) {
              addToCart(items[activeIdx]);
            }
          } else if (e.key === "Escape") {
            setQ("");
          }
        }}
        placeholder="Cari produk / scan barcode"
        className="input"
        autoComplete="off"
        inputMode="search"
        aria-autocomplete="list"
        aria-controls="pos-search-listbox"
        aria-expanded={showResults}
      />

      <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>API: {BASE}</div>

      {loading && <div className="card soft" style={{ padding: 12 }}>Memuat…</div>}
      {errorText && (
        <div className="card soft" style={{ padding: 10, color: "var(--danger-600)" }}>
          {errorText}
        </div>
      )}

      {showShortHint && (
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
          Ketik minimal 2 karakter atau scan barcode.
        </div>
      )}
      {showNoResults && (
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
          Tidak ada hasil. Coba kata kunci lain.
        </div>
      )}

      {showResults && (
        <div
          id="pos-search-listbox"
          role="listbox"
          aria-label="Hasil pencarian produk"
          ref={listRef}
          className="card soft"
          style={{ marginTop: 8, maxHeight: 420, overflow: "auto", padding: 0 }}
        >
          {items.map((v, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={v.id}
                role="option"
                aria-selected={isActive}
                data-active={isActive ? "true" : "false"}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => addToCart(v)}
                className="button button-ghost"
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  borderBottom: "1px solid var(--border-muted, rgba(0,0,0,0.06))",
                  background: isActive ? "var(--surface-muted, #fafafa)" : "transparent",
                  borderRadius: 0,
                }}
              >
                <div
                  style={{
                    height: 40,
                    width: 40,
                    borderRadius: 8,
                    background: "var(--surface-2, #f3f3f3)",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {v.image_url ? (
                    <img
                      loading="lazy"
                      src={v.image_url ?? ""}
                      alt={v.name}
                      style={{ height: "100%", width: "100%", objectFit: "cover" }}
                      decoding="async"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/no-image.svg"; }}
                    />
                  ) : (
                    <div
                      style={{
                        height: "100%",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: "var(--muted-600, #9ca3af)",
                      }}
                    >
                      No Img
                    </div>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {v.name}
                  </div>
                  <div className="muted" style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {v.sku}{v.barcode ? ` • ${v.barcode}` : ""}
                  </div>
                </div>

                <div style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>
                  {Intl.NumberFormat("id-ID").format(v.harga)}
                </div>
              </button>
            );
          })}

          {/* Sentinel untuk infinite scroll */}
          <div ref={sentinelRef} style={{ height: 6 }} />
        </div>
      )}

      {hasMore && showResults && (
        <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Gulir ke bawah untuk memuat lebih banyak…
        </div>
      )}
      {!hasMore && showResults && (
        <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Semua produk sudah ditampilkan.
        </div>
      )}
    </div>
  );
}
