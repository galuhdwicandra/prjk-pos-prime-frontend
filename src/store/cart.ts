// src/store/cart.ts
import { create } from 'zustand';
import type { CartItem, QuoteResult } from '../types/pos';
import { quoteCart } from '../api/pos';

type CartState = {
  items: CartItem[];
  quoting: boolean;
  quote?: QuoteResult;
  error?: string | null;
};

type AddItemLegacy = { product_id: number; variant_id?: number | null; qty: number };

type Actions = {
  add: (item: CartItem) => void;
  // ✅ Terima payload lama ATAU baru (2025-safe)
  addItem: (item: CartItem | AddItemLegacy) => void;
  remove: (variant_id: number) => void;
  setQty: (variant_id: number, qty: number) => void;
  clear: () => void;
  recount: () => Promise<void>;
};

export const useCart = create<CartState & Actions>((set, get) => ({
  items: [],
  quoting: false,
  quote: undefined,
  error: null,

  add: (item) => {
    const exists = get().items.find(i => i.variant_id === item.variant_id);
    const items = exists
      ? get().items.map(i => i.variant_id === item.variant_id ? { ...i, qty: i.qty + item.qty } : i)
      : [...get().items, item];
    set({ items });
    void get().recount();
  },

  // ✅ Alias yang menormalkan payload lama → payload CartItem
  addItem: (raw) => {
    // dukung dua bentuk payload:
    // 1) CartItem        -> { variant_id, qty, ... }
    // 2) Legacy AddItem  -> { product_id, variant_id?, qty }
    const maybeLegacy = raw as AddItemLegacy;
    const variant_id = Number(
      // prefer payload baru
      (raw as CartItem).variant_id ??
      // fallback: legacy pakai variant_id bila ada
      maybeLegacy.variant_id ??
      // fallback terakhir: pakai product_id (untuk produk single-variant)
      maybeLegacy.product_id
    );
    const qty = Number((raw as CartItem).qty ?? maybeLegacy.qty ?? 1);

    if (!Number.isFinite(variant_id) || qty <= 0) return;
    get().add({ variant_id, qty });
  },

  remove: (variant_id) => {
    set({ items: get().items.filter(i => i.variant_id !== variant_id) });
    void get().recount();
  },

  setQty: (variant_id, qty) => {
    set({ items: get().items.map(i => i.variant_id === variant_id ? { ...i, qty } : i) });
    void get().recount();
  },

  clear: () => set({ items: [], quote: undefined, error: null }),

  recount: async () => {
    const items = get().items.filter(i => i.qty > 0);
    if (items.length === 0) { set({ quote: undefined, error: null }); return; }
    set({ quoting: true, error: null });
    try {
      const quote = await quoteCart(items);
      set({ quote });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ quoting: false });
    }
  }
}));
