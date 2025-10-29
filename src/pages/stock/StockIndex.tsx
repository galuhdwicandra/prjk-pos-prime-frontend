// src/pages/stock/StockIndex.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { Stock, StockQuery, UpdateMinStockPayload } from "../../types/stock";
import { listStocks, updateMinStock } from "../../api/stocks";
import StockTable from "../../components/stock/StockTable";
import SetInitialStockDialog from "../../components/stock/SetInitialStockDialog";
import CabangSelect from "../../components/stock/CabangSelect";
import GudangSelect from "../../components/stock/GudangSelect";
import VariantPicker from "../../components/stock/VariantPicker";
import { shallowEqual } from "../../utils/shallowEqual";

function getErrorMessage(err: unknown, fallback = "Terjadi kesalahan."): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const maybe = (err as { message?: unknown }).message;
    if (typeof maybe === "string") return maybe;
  }
  return fallback;
}

type QueryUpdater = (patch: Partial<StockQuery>) => void;

function useQueryState() {
  const [q, setQ] = useState<StockQuery>({ page: 1, per_page: 10, low: false });
  const update: QueryUpdater = useCallback((patch) => {
    setQ(prev => {
      const next = { ...prev, ...patch };
      const resetPage =
        (patch.cabang_id !== undefined && patch.cabang_id !== prev.cabang_id) ||
        (patch.gudang_id !== undefined && patch.gudang_id !== prev.gudang_id) ||
        (patch.product_variant_id !== undefined && patch.product_variant_id !== prev.product_variant_id) ||
        (patch.low !== undefined && patch.low !== prev.low) ||
        (patch.per_page !== undefined && patch.per_page !== prev.per_page);

      if (resetPage) next.page = 1;
      return shallowEqual(prev, next) ? prev : next;
    });
  }, []);

  const setQDirect = useCallback((next: StockQuery) => {
    setQ(prev => (shallowEqual(prev, next) ? prev : next));
  }, []);

  return { q, update, setQ: setQDirect };
}

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function StockIndex() {
  const { q, update } = useQueryState();
  const debouncedQ = useDebounced(q, 150);

  const [rows, setRows] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [openSet, setOpenSet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCabangChange = useCallback(
    (id: number | undefined) => update({ cabang_id: id, gudang_id: undefined }),
    [update]
  );

  const onGudangChange = useCallback(
    (id: number | undefined) => update({ gudang_id: id }),
    [update]
  );

  const onVariantChange = useCallback(
    (variantId: number | undefined) => update({ product_variant_id: variantId }),
    [update]
  );

  function normalizeQuery(q: StockQuery): StockQuery {
    return {
      page: q.page ?? 1,
      per_page: q.per_page ?? 10,
      low: !!q.low,
      cabang_id: q.cabang_id ?? undefined,
      gudang_id: q.gudang_id ?? undefined,
      product_variant_id: q.product_variant_id ?? undefined,
    };
  }

  const stableQuery = useMemo<StockQuery>(() => normalizeQuery(debouncedQ), [debouncedQ]);

  const abortRef = useRef<AbortController | null>(null);
  const lastQS = useRef<string>("");

  const reload = useCallback(async () => {
    setError(null);

    const qs = new URLSearchParams(
      Object.entries(stableQuery).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v == null) return acc;
        if (typeof v === "boolean") { acc[k] = v ? "1" : "0"; return acc; }
        if (typeof v === "number") { if (!Number.isNaN(v)) acc[k] = String(v); return acc; }
        const s = String(v);
        if (s !== "") acc[k] = s;
        return acc;
      }, {})
    ).toString();

    if (qs === lastQS.current) return;
    lastQS.current = qs;

    setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await listStocks(stableQuery, { signal: ctrl.signal });
      setRows(res.data);
    } catch (err: unknown) {
      if ((err as { name?: string }).name !== "AbortError") {
        setError(getErrorMessage(err, "Gagal memuat stok."));
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [stableQuery]);

  const mountedOnce = useRef(false);

  useEffect(() => {
    if (mountedOnce.current) return;
    mountedOnce.current = true;
    void reload();
    return () => { abortRef.current?.abort(); };
  }, [reload]);

  useEffect(() => {
    if (!mountedOnce.current) return;
    void reload();
    return () => { abortRef.current?.abort(); };
  }, [reload]);

  const onEditMin = useCallback(async (row: Stock) => {
    const current = row.variant?.sku ?? String(row.product_variant_id);
    const val = window.prompt(`Ubah Min Stok untuk SKU ${current}`, String(row.min_stok));
    if (val == null) return;

    const parsed = Number(val);
    const payload: UpdateMinStockPayload = { min_stok: Number.isFinite(parsed) ? parsed : 0 };

    try {
      await updateMinStock(row.id, payload);
      void reload();
    } catch (e: unknown) {
      window.alert(getErrorMessage(e, "Gagal update min stok"));
    }
  }, [reload]);

  return (
    <div className="container">
      {/* FILTERS */}
      <div className="card mb-4">
        <h2 className="mb-3">Manajemen Stok</h2>

        {/* Baris 1: Cabang | Gudang | Per Page */}
        <div className="form-row form-row--3 mb-3">
          <div>
            <label className="mb-2">Cabang</label>
            <CabangSelect allowAll value={q.cabang_id} onChange={onCabangChange} />
          </div>

          <div>
            <label className="mb-2">Gudang</label>
            <GudangSelect
              allowAll
              cabangId={q.cabang_id}
              value={q.gudang_id}
              onChange={onGudangChange}
            />
          </div>

          <div>
            <label className="mb-2">Per Page</label>
            <select
              className="select"
              value={q.per_page ?? 10}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => update({ per_page: Number(e.target.value) })}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Baris 2: Variant (lebar) | Low Stock | Tombol Set Stok */}
        <div className="form-row form-row--3">
          <div>
            <label className="mb-2">Varian Produk</label>
            <VariantPicker value={q.product_variant_id} onChange={onVariantChange} />
          </div>

          <div>
            <label className="mb-2">Filter</label>
            <div>
              <label>
                <input
                  id="low"
                  type="checkbox"
                  checked={Boolean(q.low)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ low: e.target.checked })}
                />{" "}
                Hanya Low Stock
              </label>
            </div>
          </div>

          <div>
            <label className="mb-2">&nbsp;</label>
            <button
              onClick={() => setOpenSet(true)}
              className="button button-primary"
            >
              Set Stok Awal
            </button>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="card mb-4">
          <div className="badge badge-danger" style={{ marginRight: 8 }}>Error</div>
          <span>{error}</span>
        </div>
      )}

      {/* TABLE */}
      <div className="card">
        <StockTable rows={rows} loading={loading} onEditMin={onEditMin} />
      </div>

      {/* DIALOG */}
      {openSet && (
        <SetInitialStockDialog
          open={openSet}
          onClose={() => setOpenSet(false)}
          onSuccess={reload}
        />
      )}
    </div>
  );
}
