// src/components/stock/VariantPicker.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { listProducts, listVariants } from "../../api/products";
import type { Product, ProductVariant } from "../../types/product";

// tiny debounce hook (stable for 2025)
function useDebounced<T>(value: T, ms: number): T {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDeb(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return deb;
}

type Props = {
  value?: number;                               // product_variant_id (controlled by parent)
  onChange: (variantId: number | undefined) => void;
  autoSelectFirst?: boolean;                    // default: false
};

function VariantPicker({ value, onChange, autoSelectFirst = false }: Props) {
  const [search, setSearch] = useState("");
  const debSearch = useDebounced(search, 250);

  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<number | undefined>(undefined);

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loadingP, setLoadingP] = useState(false);
  const [loadingV, setLoadingV] = useState(false);
  const [errP, setErrP] = useState<string | null>(null);
  const [errV, setErrV] = useState<string | null>(null);

  // ── Fetch products (debounced, abortable)
  useEffect(() => {
    const ctrl = new AbortController();
    setLoadingP(true); setErrP(null);

    listProducts({ search: debSearch, per_page: 10 }, { signal: ctrl.signal })
      .then((res) => setProducts(res.data ?? []))
      .catch((e: unknown) => {
        if ((e as { name?: string }).name !== "AbortError") {
          setErrP((e as Error)?.message ?? "Gagal memuat produk.");
        }
      })
      .finally(() => { if (!ctrl.signal.aborted) setLoadingP(false); });

    return () => ctrl.abort();
  }, [debSearch]);

  // Reset variants immediately when product changes
  useEffect(() => { setVariants([]); }, [productId]);

  // ── Fetch variants for selected product (abortable)
  useEffect(() => {
    if (!productId) return;
    const ctrl = new AbortController();
    setLoadingV(true); setErrV(null);

    listVariants(productId, { signal: ctrl.signal })
      .then((rows) => setVariants(rows ?? []))
      .catch((e: unknown) => {
        if ((e as { name?: string }).name !== "AbortError") {
          setErrV((e as Error)?.message ?? "Gagal memuat varian.");
        }
      })
      .finally(() => { if (!ctrl.signal.aborted) setLoadingV(false); });

    return () => ctrl.abort();
  }, [productId]);

  // ── If the current selected variant is not present after variants load, clear it ONCE
  const clearedRef = useRef(false);
  useEffect(() => {
    if (!variants.length) return;
    if (value == null) return;

    const stillExists = variants.some(v => v.id === value);
    if (stillExists) {
      clearedRef.current = false;
      return;
    }

    if (!clearedRef.current) {
      clearedRef.current = true;
      onChange(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants, value]);

  // ── Optional: auto-select first variant ONCE per options set
  const autoEmitRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!autoSelectFirst) return;
    if (!variants.length) return;

    const firstId = variants[0].id;
    if (value === firstId) return;
    if (autoEmitRef.current === firstId) return;

    autoEmitRef.current = firstId;
    onChange(firstId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSelectFirst, variants, value]);

  // Better UX: keep product dropdown stable and sorted
  const productOptions = useMemo(
    () => [...products].sort((a, b) => a.nama.localeCompare(b.nama, "id")),
    [products]
  );

  return (
    <div>
      {/* Baris pencarian produk */}
      <div className="form-row">
        <div>
          <label htmlFor="vp-search" className="mb-2">Cari Produk</label>
          <input
            id="vp-search"
            className="input"
            placeholder="Ketik nama/SKU produk…"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
          {errP && <div className="help help--error">{errP}</div>}
        </div>

        <div>
          <label htmlFor="vp-product" className="mb-2">Produk</label>
          <select
            id="vp-product"
            className="select"
            value={productId ?? ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const next = e.target.value ? Number(e.target.value) : undefined;
              if (next === productId) return;
              setProductId(next);
              if (value !== undefined) onChange(undefined);
            }}
            disabled={loadingP}
            aria-label="Pilih Produk"
          >
            <option value="">Pilih produk…</option>
            {productOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Baris varian */}
      <div className="form-row">
        <div>
          <label htmlFor="vp-variant" className="mb-2">Varian</label>
          <select
            id="vp-variant"
            className="select"
            value={value ?? ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const next = e.target.value ? Number(e.target.value) : undefined;
              if (next === value) return;
              onChange(next);
            }}
            disabled={!productId || loadingV}
            aria-label="Pilih Varian"
          >
            <option value="">{productId ? "Pilih varian…" : "Pilih produk dulu"}</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.sku} · {v.size ?? "—"} {v.type ? `· ${v.type}` : ""} {v.tester ? `· ${v.tester}` : ""}
              </option>
            ))}
          </select>
          {errV && <div className="help help--error">{errV}</div>}
        </div>
      </div>
    </div>
  );
}

export default React.memo(VariantPicker);
