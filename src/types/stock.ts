// Types kuat tanpa any, konsisten dengan backend VariantStockController.

export type ID = number;

export interface PaginatedMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  next_page_url?: string | null;
  prev_page_url?: string | null;
}

export interface CabangLite { id: ID; nama: string }
export interface GudangLite { id: ID; nama: string }
export interface VariantLite {
  id: ID;
  sku: string;
  nama_produk: string;
  size?: string | null;
  type?: string | null;
  tester?: string | null;
}

export interface Stock {
  id: ID;
  cabang_id: ID;
  gudang_id: ID;
  product_variant_id: ID;
  qty: number;
  min_stok: number;
  is_low_stock: boolean; // dihitung server: qty < min_stok
  gudang?: GudangLite;
  cabang?: CabangLite;
  variant?: VariantLite;
  created_at?: string;
  updated_at?: string;
}

export type StockQuery = Partial<{
  cabang_id: ID;
  gudang_id: ID;
  product_variant_id: ID;
  low: boolean;        // true => hanya low-stock
  page: number;
  per_page: number;
}>;

export interface SetInitialStockPayload {
  gudang_id: ID;
  product_variant_id: ID;
  qty: number;
  min_stok?: number;
}

export interface UpdateMinStockPayload {
  min_stok: number;
}

export interface AdjustStockPayload {
  type: 'in' | 'out'; // penyesuaian manual
  amount: number;
  note?: string;
}
