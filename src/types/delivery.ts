// src/types/delivery.ts
import type { ID } from "./pos";

export type DeliveryType = "PICKUP" | "DELIVERY" | "BOTH";
export type DeliveryStatus =
    | "REQUESTED"
    | "ASSIGNED"
    | "PICKED_UP"
    | "ON_ROUTE"
    | "DELIVERED"
    | "FAILED"
    | "CANCELLED";

export type Delivery = {
    id: ID;
    order_id: ID;
    assigned_to?: ID | null;        // user kurir
    type: DeliveryType;
    status: DeliveryStatus;
    pickup_address?: string | null;
    delivery_address?: string | null;
    pickup_lat?: number | null;
    pickup_lng?: number | null;
    delivery_lat?: number | null;
    delivery_lng?: number | null;
    requested_at: string;           // ISO
    completed_at?: string | null;
    created_at?: string;
    updated_at?: string;

    // include ringan (opsional dari backend)
    order_code?: string;
    courier_name?: string | null;
};

export type DeliveryEvent = {
    id: ID;
    delivery_id: ID;
    status: DeliveryStatus | "DAMAGE"; // DAMAGE = event khusus klaim kerusakan
    note?: string | null;
    photo_url?: string | null;
    occurred_at: string;
    created_at?: string;
    updated_at?: string;
};

export type DeliveryQuery = Partial<{
    page: number;
    per_page: number;
    q: string;              // kode order / nama kurir / alamat
    cabang_id: ID;
    status: DeliveryStatus;
    date_from: string;      // YYYY-MM-DD
    date_to: string;        // YYYY-MM-DD
    mine: 0 | 1;            // hanya milik kurir aktif
    sort: "requested_at" | "-requested_at";
}>;

export type PaginatedMeta = {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
};
export type DeliveryPaged = { data: Delivery[]; meta: PaginatedMeta };

export type CreateDeliveryPayload = {
    order_id: ID;
    type: DeliveryType;
    pickup_address?: string | null;
    delivery_address?: string | null;
};

export type AssignCourierPayload = {
    courier_id: ID;
    auto?: boolean; // true = minta backend pilih otomatis (auto-assign)
};

export type UpdateStatusPayload = {
    status: Exclude<DeliveryStatus, "REQUESTED" | "ASSIGNED">; // next statuses
    note?: string | null;
};

export type DamageClaimPayload = {
    note?: string | null;
    // upload foto via multipart
};

export type WaybillInfo = {
  waybill_no: string;         // nomor surat jalan
  delivery_id: number;
  order_code: string;          // kode pesanan/nota
  branch_name: string;
  branch_address?: string | null;
  courier_name: string;
  courier_phone?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  pickup_address?: string | null;
  dropoff_address?: string | null;
  scheduled_at?: string | null; // ISO string
  created_at: string;           // ISO string
  items: Array<{
    name: string;
    variant?: string | null;
    qty: number;
    unit?: string | null;
    note?: string | null;
  }>;
  cod_amount?: number | null;   // jika ada COD
  notes?: string | null;        // catatan internal/khusus
  tracking_url?: string | null; // opsional: link tracking
};

export type DeliveryDetail = Delivery & { events: DeliveryEvent[] };
