// src/api/pos.ts
import type {
  CartItem, CheckoutPayload, Order, QuoteResult, CheckoutPayment, OrdersQuery, OrdersPaged,
  UpdateOrderItemsPayload, ReprintPayload, ResendWaPayload, ID, FeeEntry, FeePaged, FeeQuery,
  CashPosition
} from "../types/pos";
import { getAuthToken } from "./client";

// Base URL normalization (VITE_API_URL like "http://localhost:8000/api/v1")
const RAW = (import.meta.env).VITE_API_URL ?? (import.meta.env).VITE_API_BASE_URL;
if (!RAW) throw new Error("VITE_API_URL / VITE_API_BASE_URL belum diset.");
const BASE = RAW.replace(/\/+$/, ""); // strip trailing slash

function authJsonHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token) throw new Error("Token hilang. Login dulu sebelum memanggil POS API.");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// Helper: fail fast on redirects (usually means auth misconfig causing 302 → :5173)
function assertNoRedirect(res: Response): void {
  if (res.redirected) {
    throw new Error(
      `Request ter-redirect ke ${res.url}. Cek token & header Accept: application/json di frontend, serta CORS di backend.`
    );
  }
}

async function json<T>(res: Response): Promise<T> {
  assertNoRedirect(res);
  const text = await res.text();
  if (!res.ok) {
    try {
      const parsed = JSON.parse(text) as unknown;
      const message =
        typeof parsed === "object" && parsed !== null && "message" in parsed
          ? String((parsed as { message: unknown }).message)
          : `HTTP ${res.status}`;
      throw new Error(message);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Response bukan JSON valid.");
  }
}

export async function quoteCart(items: CartItem[]): Promise<QuoteResult> {
  const res = await fetch(`${BASE}/cart/quote`, {
    method: "POST",
    headers: authJsonHeaders(),
    body: JSON.stringify({ items }),
  });
  return json<QuoteResult>(res);
}

export async function checkout(payload: CheckoutPayload): Promise<Order> {
  // Build payload sesuai backend
  const body = {
    items: payload.items,
    customer: payload.customer,
    customer_id: payload.customer_id ?? null,

    cabang_id: payload.branch_id,
    gudang_id: payload.warehouse_id,
    note: payload.note ?? null,
    cash_position: payload.cash_position ?? null,

    payment: payload.payment,
  };

  const res = await fetch(`${BASE}/checkout`, {
    method: "POST",
    headers: authJsonHeaders(),
    // drop undefined otomatis
    body: JSON.stringify(body),
  });
  return json<Order>(res);
}

export async function addPayment(orderId: number, payment: CheckoutPayment): Promise<Order> {
  const res = await fetch(`${BASE}/orders/${orderId}/payments`, {
    method: "POST",
    headers: authJsonHeaders(),
    body: JSON.stringify({
      method: payment.method,
      amount: payment.amount,
      ref_no: payment.ref_no ?? null,
      payload_json: payment.payload_json ?? undefined,
    }),
  });
  return json<Order>(res);
}

export async function getReceiptHtml(orderId: number): Promise<string> {
  const token = getAuthToken();
  if (!token) throw new Error("Token hilang. Login dulu.");
  const res = await fetch(`${BASE}/orders/${orderId}/print`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/html,application/json",
    },
  });
  assertNoRedirect(res);
  if (!res.ok) throw new Error(`Gagal mengambil struk (HTTP ${res.status})`);
  return res.text();
}

// Utility query-string builder
function toQuery(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    usp.set(k, String(v));
  });
  const q = usp.toString();
  return q ? `?${q}` : "";
}

type Meta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

type Paginator<T> = Meta & { data: T[] };

function isObjectRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function isNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

function isMeta(x: unknown): x is Meta {
  if (!isObjectRecord(x)) return false;
  return (
    isNumber(x.current_page) &&
    isNumber(x.per_page) &&
    isNumber(x.total) &&
    isNumber(x.last_page)
  );
}

function isPaginator<T>(x: unknown): x is Paginator<T> {
  if (!isObjectRecord(x)) return false;
  const data = x.data;
  return Array.isArray(data) && isMeta(x);
}

/** GET /orders — daftar pesanan (filter cabang/status, tanggal, search) */
export async function listOrders(q: OrdersQuery = {}): Promise<OrdersPaged> {
  const res = await fetch(`${BASE}/orders${toQuery(q)}`, {
    method: "GET",
    headers: authJsonHeaders(),
  });
  const raw = await json<unknown>(res);

  // A) { data: { current_page, data:[...], per_page, total, last_page } }
  if (isObjectRecord(raw) && "data" in raw) {
    const d = (raw as Record<string, unknown>).data;
    if (isPaginator<Order>(d)) {
      return {
        data: d.data,
        meta: {
          current_page: d.current_page,
          per_page: d.per_page,
          total: d.total,
          last_page: d.last_page,
        },
      };
    }
  }

  // B) { current_page, data:[...], per_page, total, last_page }
  if (isPaginator<Order>(raw)) {
    return {
      data: raw.data,
      meta: {
        current_page: raw.current_page,
        per_page: raw.per_page,
        total: raw.total,
        last_page: raw.last_page,
      },
    };
  }

  // C) { data:[...], meta:{ current_page, per_page, total, last_page } }
  if (isObjectRecord(raw) && "data" in raw && "meta" in raw) {
    const d = (raw as Record<string, unknown>).data;
    const m = (raw as Record<string, unknown>).meta;
    if (Array.isArray(d) && isMeta(m)) {
      return {
        data: d as Order[],
        meta: {
          current_page: m.current_page,
          per_page: m.per_page,
          total: m.total,
          last_page: m.last_page,
        },
      };
    }
  }

  throw new Error("Bentuk respons /orders tidak dikenali (expected paginator).");
}

/** GET /orders/:id — detail order dengan items & payments */
export async function getOrder(id: ID): Promise<Order> {
  const res = await fetch(`${BASE}/orders/${id}`, {
    method: "GET",
    headers: authJsonHeaders(),
  });
  const raw = await json<unknown>(res);

  if (isObjectRecord(raw) && "data" in raw) {
    return (raw as { data: Order }).data;
  }
  return raw as Order;
}

/** PUT /orders/:id/items — edit item/qty/harga (server re-hitungan subtotal/grand_total) */
export async function updateOrderItems(id: ID, payload: UpdateOrderItemsPayload): Promise<Order> {
  const res = await fetch(`${BASE}/orders/${id}/items`, {
    method: "PUT",
    headers: authJsonHeaders(),
    body: JSON.stringify(payload),
  });
  const raw = await json<unknown>(res);

  if (isObjectRecord(raw) && "data" in raw) {
    return (raw as { data: Order }).data;
  }
  return raw as Order;
}

/** POST /orders/:id/reprint — re-print struk (58/80mm) + log audit */
export async function reprintReceipt(id: ID, payload: ReprintPayload): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/orders/${id}/reprint`, {
    method: "POST",
    headers: authJsonHeaders(),
    body: JSON.stringify(payload),
  });
  const j = await json<{ message: string; data: unknown }>(res);
  return { message: j.message };
}

/** POST /orders/:id/resend-wa — kirim ulang ke WhatsApp + log audit */
export async function resendWhatsApp(
  id: ID,
  payload: ResendWaPayload
): Promise<{ message: string; wa_url?: string }> {
  const res = await fetch(`${BASE}/orders/${id}/resend-wa`, {
    method: "POST",
    headers: authJsonHeaders(),
    body: JSON.stringify(payload),
  });

  // BE kadang kirim { message, wa_url } atau { message, data: { wa_url } }
  const j = await json<{ message: string; wa_url?: string; data?: unknown }>(res);

  const wa_url =
    (j as any).wa_url ??
    (isObjectRecord((j as any).data) && typeof (j as any).data.wa_url === "string"
      ? ((j as any).data as Record<string, unknown>).wa_url as string
      : undefined);

  return { message: j.message, wa_url };
}

export async function setOrderCashPosition(orderId: ID, cashPosition: CashPosition): Promise<Order> {
  const res = await fetch(`${BASE}/orders/${orderId}/cash-position`, {
    method: "POST",
    headers: authJsonHeaders(),
    body: JSON.stringify({ cash_position: cashPosition }),
  });
  return json<Order>(res);
}

/** GET /fee-entries — list fees (admin sees all; others see filtered; `mine=1` allowed) */
export async function listFees(q: FeeQuery = {}): Promise<FeePaged> {
  const res = await fetch(
    `${BASE}/fee-entries${toQuery({
      cabang_id: q.cabang_id,
      from: q.from,
      to: q.to,
      pay_status: q.pay_status,
      page: q.page,
      per_page: q.per_page,
    })}`,
    {
      method: "GET",
      headers: authJsonHeaders(),
    }
  );
  // Backends in this project sometimes return { data, meta } or Laravel classic paginator
  const raw = await json<unknown>(res);
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    // Case A: { data: FeeEntry[], meta: {...} }
    if (Array.isArray(o.data) && typeof o.meta === "object" && o.meta !== null) {
      const m = o.meta as Record<string, unknown>;
      return {
        data: o.data as FeeEntry[],
        meta: {
          current_page: Number(m.current_page ?? 1),
          per_page: Number(m.per_page ?? 10),
          total: Number(m.total ?? (Array.isArray(o.data) ? o.data.length : 0)),
          last_page: Number(m.last_page ?? 1),
        },
      };
    }
    // Case B: Laravel classic top-level
    if (Array.isArray(o.data) && ('current_page' in o || 'last_page' in o)) {
      return {
        data: o.data as FeeEntry[],
        meta: {
          current_page: Number((o as { current_page?: number }).current_page ?? 1),
          per_page: Number((o as { per_page?: number }).per_page ?? 10),
          total: Number((o as { total?: number }).total ?? ((o.data as unknown[]).length)),
          last_page: Number((o as { last_page?: number }).last_page ?? 1),
        },
      };
    }
  }
  // Fallback safe
  return { data: [], meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 } };
}

/** Shortcut for the current user */
/** Export CSV: GET /fee-entries/export?{filters} → triggers download */
export async function exportFeesCsv(q: FeeQuery = {}): Promise<Blob> {
  const url = `${BASE}/fee-entries/export${toQuery({
    cabang_id: q.cabang_id,
    from: q.from,
    to: q.to,
    pay_status: q.pay_status,
  })}`;
  const res = await fetch(url, { method: "GET", headers: authJsonHeaders() });
  assertNoRedirect(res);
  if (!res.ok) throw new Error(`Gagal export CSV (HTTP ${res.status})`);
  return res.blob();
}