// src/pages/pos/Orders.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import ProductSearch from '../../components/pos/ProductSearch';
import ProductGrid from '../../components/pos/ProductGrid';
import CartPanel from '../../components/pos/CartPanel';
import CheckoutDialog from '../../components/pos/CheckoutDialog';
import ReceiptPreview from '../../components/pos/ReceiptPreview';
import { useCart } from '../../store/cart';
import type { Order } from '../../types/pos';
import type { Product } from '../../types/product';

/** Helpers */
const getInt = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const setScope = (branchId: number, warehouseId: number): void => {
  localStorage.setItem('active_branch_id', String(branchId));
  localStorage.setItem('active_warehouse_id', String(warehouseId));
  window.dispatchEvent(new Event('scope:changed'));
};

/** ✅ Reactive scope + auto-pick default (first branch & warehouse) */
function useActiveScope(): { branch: { id: number } | null; warehouse: { id: number } | null } {
  const [branchId, setBranchId] = useState<number | null>(null);
  const [warehouseId, setWarehouseId] = useState<number | null>(null);

  const read = useCallback((): void => {
    setBranchId(getInt(localStorage.getItem('active_branch_id')));
    setWarehouseId(getInt(localStorage.getItem('active_warehouse_id')));
  }, []);

  useEffect(() => {
    read();
    const onScopeChanged = (): void => read();
    window.addEventListener('scope:changed', onScopeChanged);
    window.addEventListener('storage', onScopeChanged);
    return () => {
      window.removeEventListener('scope:changed', onScopeChanged);
      window.removeEventListener('storage', onScopeChanged);
    };
  }, [read]);

  useEffect(() => {
    if (branchId && warehouseId) return;
    (async () => {
      try {
        const branchesApi = await import('../../api/branches');
        const warehousesApi = await import('../../api/warehouses');
        const branches = await branchesApi.listBranches({ per_page: 1 });
        const b = branches?.data?.[0] as { id: number } | undefined;
        if (!b) return;
        const warehouses = await warehousesApi.listWarehouses({ cabang_id: b.id, per_page: 1 });
        const w = warehouses?.data?.[0] as { id: number } | undefined;
        if (!w) return;
        setScope(b.id, w.id);
      } catch {
        // no-op; banner will handle manual selection
      }
    })();
  }, [branchId, warehouseId]);

  return {
    branch: branchId ? { id: branchId } : null,
    warehouse: warehouseId ? { id: warehouseId } : null,
  };
}

export default function OrdersPage(): React.ReactElement {
  const { branch, warehouse } = useActiveScope();
  const [openPay, setOpenPay] = useState<boolean>(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // ✅ Ambil state/aksi via selector (tanpa any/unknown)
  const items = useCart(s => s.items);
  const quote = useCart(s => s.quote);
  const add   = useCart(s => s.add);

  const hasItems = items.length > 0;
  const scoped = Boolean(warehouse?.id && branch?.id);
  const grand = quote?.totals?.grand_total ?? 0;
  const grandOk = Number.isFinite(grand) && grand >= 0;

  const canCheckout = useMemo<boolean>(() => hasItems && scoped && grandOk, [hasItems, scoped, grandOk]);

  const disableReason = useMemo<string | null>(() => {
    if (!hasItems) return 'Tambahkan item ke keranjang.';
    if (!scoped) return 'Pilih Cabang & Gudang terlebih dahulu.';
    if (!grandOk) return 'Total belum siap. Coba lagi sebentar.';
    return null;
  }, [hasItems, scoped, grandOk]);

  // Enter → buka dialog bayar jika siap
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Enter' && canCheckout) setOpenPay(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canCheckout]);

  // Klik kartu produk → tambah 1 ke cart (ambil varian pertama bila ada)
  const onPickProduct = (p: Product): void => {
    const firstVariantId =
      Array.isArray(p.variants) && p.variants.length > 0 ? Number(p.variants[0].id) : null;

    // Store `add` membutuhkan CartItem: minimal { variant_id, qty }
    const variantIdToUse = firstVariantId ?? Number(p.id); // fallback kalau produk = varian tunggal
    if (!Number.isFinite(variantIdToUse)) {
      console.warn('Tidak bisa menambahkan item: variant_id tidak valid.');
      return;
    }

    add({ variant_id: variantIdToUse, qty: 1 });
  };

  return (
    <div className="page">
      {/* Layout dua kolom responsif tanpa Tailwind */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'flex-start'
        }}
      >
        {/* Kiri: Search + Grid */}
        <div style={{ flex: '1 1 680px', minWidth: 320 }}>
          {!scoped && <ScopePickerBanner />}

          <div className="card" style={{ marginTop: scoped ? 0 : 12 }}>
            {/* 🔎 Search tetap ada; jika komponen Anda butuh warehouseId NUMBER, kirim 0 ketika belum ada */}
            <ProductSearch warehouseId={warehouse?.id ?? 0} />
          </div>

          {/* 🧱 Katalog hanya dirender setelah Gudang siap agar tidak error ke backend */}
          {warehouse?.id ? (
            <div className="card" style={{ marginTop: 12 }}>
              <ProductGrid
                onPick={onPickProduct}
                perPage={24}
                warehouseId={warehouse.id}
                requireWarehouse
              />
            </div>
          ) : (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="empty-state">Pilih Cabang &amp; Gudang untuk melihat katalog.</div>
            </div>
          )}
        </div>

        {/* Kanan: Cart + tombol bayar */}
        <div style={{ flex: '1 1 320px', minWidth: 300, maxWidth: 420 }}>
          <div className="card">
            <CartPanel />
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="form-actions" style={{ justifyContent: 'stretch' }}>
              <button
                className="button button-primary"
                onClick={() => setOpenPay(true)}
                disabled={!canCheckout}
                aria-disabled={!canCheckout}
                aria-label="Bayar pesanan"
                data-testid="btn-pay"
                style={{ width: '100%' }}
              >
                Bayar
              </button>
            </div>
            {!canCheckout && disableReason && (
              <div className="alert alert-warning" style={{ marginTop: 8 }}>{disableReason}</div>
            )}
          </div>
        </div>
      </div>

      {openPay && branch && warehouse && (
        <CheckoutDialog
          open={openPay}
          onClose={() => setOpenPay(false)}
          branchId={branch.id}
          warehouseId={warehouse.id}
          onSuccess={(o: Order): void => {
            setLastOrder(o);
            setOpenPay(false);
          }}
        />
      )}

      {lastOrder && (
        <div className="card" style={{ marginTop: 16 }}>
          <ReceiptPreview orderId={lastOrder.id} phone={undefined} />
        </div>
      )}
    </div>
  );
}

/** 🔸 Scope picker (inline) dengan loading states yang jelas */
function ScopePickerBanner(): React.ReactElement {
  type IdNama = { id: number; nama: string };

  const [branches, setBranches] = useState<IdNama[]>([]);
  const [warehouses, setWarehouses] = useState<IdNama[]>([]);
  const [bId, setBId] = useState<number | ''>('');
  const [wId, setWId] = useState<number | ''>('');
  const [loadingB, setLoadingB] = useState<boolean>(true);
  const [loadingW, setLoadingW] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const api = await import('../../api/branches');
        setLoadingB(true);
        const res = await api.listBranches({ per_page: 50 });
        const data = (res?.data ?? []) as IdNama[];
        setBranches(Array.isArray(data) ? data : []);
      } finally {
        setLoadingB(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!bId) { setWarehouses([]); setWId(''); return; }
      try {
        const api = await import('../../api/warehouses');
        setLoadingW(true);
        const res = await api.listWarehouses({ cabang_id: Number(bId), per_page: 50 });
        const data = (res?.data ?? []) as IdNama[];
        setWarehouses(Array.isArray(data) ? data : []);
        setWId(data.length > 0 ? data[0].id : '');
      } finally {
        setLoadingW(false);
      }
    })();
  }, [bId]);

  const apply = (): void => {
    if (!bId || !wId) return;
    setScope(Number(bId), Number(wId));
  };

  return (
    <div className="card soft">
      <div className="badge badge-warning" style={{ marginBottom: 8 }}>
        Scope belum dipilih
      </div>
      <div className="form-row form-row--3">
        <div className="form-field">
          <label className="label">Cabang</label>
          <select
            className="select"
            value={bId}
            onChange={(e) => setBId(e.target.value ? Number(e.target.value) : '')}
            aria-label="Pilih cabang"
          >
            <option value="">{loadingB ? 'Memuat cabang…' : 'Pilih cabang…'}</option>
            {!loadingB && branches.length === 0 && (
              <option value="">Tidak ada cabang</option>
            )}
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.nama}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="label">Gudang</label>
          <select
            className="select"
            value={wId}
            onChange={(e) => setWId(e.target.value ? Number(e.target.value) : '')}
            disabled={!bId || loadingW}
            aria-label="Pilih gudang"
          >
            <option value="">
              {!bId ? 'Pilih cabang dahulu' : (loadingW ? 'Memuat gudang…' : 'Pilih gudang…')}
            </option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.nama}</option>
            ))}
          </select>
        </div>

        <div className="form-actions" style={{ alignItems: 'end' }}>
          <button
            className="button button-primary"
            disabled={!bId || !wId}
            onClick={apply}
            aria-disabled={!bId || !wId}
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
}
