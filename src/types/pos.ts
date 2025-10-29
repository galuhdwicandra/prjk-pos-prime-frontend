// POS Prime — POS (F6) types
export type ID = number;

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'QRIS' | 'XENDIT';
export type OrderStatus = 'DRAFT' | 'UNPAID' | 'PAID' | 'VOID' | 'REFUND';
export type CashPosition = 'CUSTOMER' | 'CASHIER' | 'SALES' | 'ADMIN';

export type CartItem = {
  variant_id: ID;
  name?: string;         // snapshot (optional at cart time)
  price_hint?: number;   // allow override suggestion; backend will re-quote
  discount?: number;
  qty: number;
};

export type QuoteLine = {
  variant_id: ID;
  name_snapshot: string;
  price: number;
  discount: number;
  qty: number;
  line_total: number;
};
export type QuoteTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  service_fee: number;
  grand_total: number;
};
export type QuoteResult = {
  items: QuoteLine[];
  totals: QuoteTotals;
};

export type CheckoutCustomer = {
  nama?: string;
  phone?: string;
  alamat?: string | null;
};

export type CheckoutPayment = {
  method: PaymentMethod;
  amount: number;
  ref_no?: string | null;
  payload_json?: {
    holder_id: ID;
    collected_by?: 'CASHIER' | 'SALES' | 'COURIER';
    collected_at?: string; // ISO string
  };
};

export type CheckoutPayload = {
  items: CartItem[];
  customer?: CheckoutCustomer;
  warehouse_id: ID;
  branch_id: ID;
  note?: string | null;
  customer_id?: ID;

  // Optional immediate payment (single tender); for split use addPayment API
  payment?: CheckoutPayment;
  cash_position?: CashPosition;
};

export type OrderItem = QuoteLine & { id: ID; order_id: ID };
export type Payment = {
  id: ID;
  order_id: ID;
  method: PaymentMethod;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUND';
  ref_no?: string | null;
  paid_at?: string | null;
};

export type Order = {
  id: ID;
  kode: string;
  branch_id: ID;
  warehouse_id: ID;
  cashier_id: ID;
  customer_id?: ID | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  service_fee: number;
  grand_total: number;
  paid_total: number;
  ordered_at: string;
  items: OrderItem[];
  payments: Payment[];
  cash_position?: CashPosition | null;
};

// ---- Orders listing & edit types (F7) ----
export type OrdersSort = 'ordered_at' | '-ordered_at' | 'kode' | '-kode' | 'grand_total' | '-grand_total';

export type OrdersQuery = Partial<{
  page: number;
  per_page: number;
  q: string;                 // cari kode / phone / nama customer
  cabang_id: ID;             // filter by branch (cabang)
  status: OrderStatus;       // DRAFT | UNPAID | PAID | VOID | REFUND
  date_from: string;         // 'YYYY-MM-DD'
  date_to: string;           // 'YYYY-MM-DD'
  sort: OrdersSort;
  cash_position: CashPosition;
}>;

export type PaginatedMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type OrdersPaged = { data: Order[]; meta: PaginatedMeta };

// Payload untuk edit item/qty/harga (server akan re-calc totals)
export type UpdateOrderItemsPayload = {
  note?: string | null;      // alasan koreksi (opsional)
  items: Array<{
    id: ID;                   // order_items.id existing
    price: number;
    discount: number;
    qty: number;
  }>;
};

// Aksi khusus
export type ReprintPayload = { format: '58' | '80' };
export type ResendWaPayload = { phone: string; message?: string };

// ======================= FEES (F10) =======================
export type FeePayStatus = 'UNPAID' | 'PAID' | 'PARTIAL';

/** Mirrors table public.fee_entries exactly. */
export type FeeEntry = {
  id: ID;
  fee_id: ID;
  cabang_id: ID;
  period_date: string;             // YYYY-MM-DD
  ref_type: 'ORDER' | 'DELIVERY';
  ref_id: ID;
  owner_user_id: ID | null;        // penerima fee (sales/cashier/courier)
  base_amount: number;             // numeric(18,2)
  fee_amount: number;              // numeric(18,2)
  pay_status: FeePayStatus;        // UNPAID | PAID | PARTIAL
  paid_amount: number;             // numeric(18,2)
  paid_at: string | null;          // ISO timestamp or null
  notes?: string | null;
  created_by?: ID | null;
  updated_by?: ID | null;
  created_at?: string | null;
  updated_at?: string | null;
  // optional expand from backend (if provided by with(['fee'])):
  fee?: { id: ID; kind: 'SALES' | 'CASHIER' | 'COURIER'; name?: string | null } | null;
};

export type FeeQuery = Partial<{
  page: number;
  per_page: number;
  cabang_id: ID;
  from: string;                   // YYYY-MM-DD
  to: string;                     // YYYY-MM-DD
  pay_status: FeePayStatus;       // filter by status
}>;

export type FeePaged = {
  data: FeeEntry[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};