import type {
  Stock, StockQuery, PaginatedResponse,
  SetInitialStockPayload, UpdateMinStockPayload, AdjustStockPayload, ID
} from "../types/stock";
import { getAuthToken } from "../api/client";

/**
 * Base URL dari .env
 * Contoh: VITE_API_URL="http://localhost:8000/api/v1"
 * SOP: dinormalisasi, selalu Authorization: Bearer <token>
 */
const RAW = (import.meta.env).VITE_API_URL ?? (import.meta.env).VITE_API_BASE_URL;
if (!RAW) throw new Error("VITE_API_URL / VITE_API_BASE_URL belum diset.");
const BASE = RAW.replace(/\/+$/,''); // no trailing slash

function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new Error("Auth token tidak ditemukan.");
  return {
    "Authorization": `Bearer ${token}`,
  };
}

function jsonHeaders() {
  return { "Content-Type": "application/json", ...authHeaders() };
}

function toQuery(q?: Record<string, unknown>) {
  if (!q) return "";
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (typeof v === "boolean") params.append(k, v ? "1" : "0");
    else params.append(k, String(v));
  });
  return params.toString() ? `?${params.toString()}` : "";
}

export async function listStocks(
  query?: StockQuery,
  init?: { signal?: AbortSignal }
): Promise<PaginatedResponse<Stock>> {
  const url = `${BASE}/stocks${toQuery(query)}`;
  const res = await fetch(url, {
    headers: authHeaders(),
    signal: init?.signal,            // ← pass abort signal through
  });
  if (!res.ok) throw new Error(`Gagal memuat stok: ${res.status}`);
  return res.json();
}

export async function getStock(id: ID, init?: { signal?: AbortSignal }): Promise<{ data: Stock }> {
  const res = await fetch(`${BASE}/stocks/${id}`, { headers: authHeaders(), signal: init?.signal });
  if (!res.ok) throw new Error(`Gagal memuat stok #${id}: ${res.status}`);
  return res.json();
}

/** Set stok awal (upsert unik: gudang_id + product_variant_id) */
export async function setInitialStock(payload: SetInitialStockPayload): Promise<{ message: string; data: Stock }> {
  // pastikan numerik dikirim sebagai number
  const body = JSON.stringify({
    gudang_id: Number(payload.gudang_id),
    product_variant_id: Number(payload.product_variant_id),
    qty: Number(payload.qty),
    ...(payload.min_stok != null ? { min_stok: Number(payload.min_stok) } : {})
  });
  const res = await fetch(`${BASE}/stocks`, { method: "POST", headers: jsonHeaders(), body });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Gagal set stok awal.");
  return json;
}

/** Ubah threshold min_stok */
export async function updateMinStock(id: ID, payload: UpdateMinStockPayload): Promise<{ message: string; data: Stock }> {
  const res = await fetch(`${BASE}/stocks/${id}`, {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ min_stok: Number(payload.min_stok) })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Gagal update min_stok.");
  return json;
}

/** Penyesuaian manual stok (opsional untuk admin gudang) */
export async function adjustStock(id: ID, payload: AdjustStockPayload): Promise<{ message: string; data: Stock }> {
  const res = await fetch(`${BASE}/stocks/${id}/adjust`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      type: payload.type,
      amount: Number(payload.amount),
      ...(payload.note ? { note: payload.note } : {})
    })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Gagal adjust stok.");
  return json;
}

export async function deleteStock(id: ID): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/stocks/${id}`, { method: "DELETE", headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || `Gagal hapus stok #${id}.`);
  return json;
}
