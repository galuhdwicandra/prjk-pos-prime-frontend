// src/api/products.ts
import { api } from "./client";
import type {
  ApiError,
  PaginatedResponse,
  Product,
  ProductCreatePayload,
  ProductQuery,
  ProductUpdatePayload,
  ProductVariant,
  VariantCreatePayload,
  VariantUpdatePayload,
  ProductMedia,
  MediaUploadResult,
} from "../types/product";
import { mediaPathToUrl } from "./_files";

// ---------- Helpers ----------
function toBoolNum(v?: boolean): 0 | 1 | undefined {
  return typeof v === "boolean" ? (v ? 1 : 0) : undefined;
}

type AxiosErr = {
  response?: {
    status?: number;
    headers?: Record<string, string>;
    data?: unknown;
  };
  code?: string;
  name?: string;
  message?: string;
};

function isCancelLike(err: unknown): boolean {
  // fetch AbortController & axios cancel
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (typeof err === "object" && err !== null) {
    const o = err as { code?: string; name?: string; message?: string };
    if (o.name === "AbortError") return true;
    if (o.code === "ERR_CANCELED") return true;
    if (typeof o.message === "string" && /aborted|canceled/i.test(o.message)) return true;
  }
  return false;
}

function isHtmlPayload(x: unknown): boolean {
  if (typeof x !== "string") return false;
  return /<\s*html\b|<!doctype/i.test(x);
}

function pickMessageFromResponse(raw: unknown): string | undefined {
  // JSON { message, errors } seperti biasa
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    const msg = typeof o.message === "string" ? o.message : undefined;
    if (msg && msg.trim()) return msg;
    // errors: { field: [ "msg" ] }
    const errs = o.errors as unknown;
    if (errs && typeof errs === "object") {
      const first = Object.values(errs as Record<string, unknown[]>)[0]?.[0];
      if (typeof first === "string" && first.trim()) return first;
    }
  }
  // HTML (redirect/login)
  if (isHtmlPayload(raw)) return "Server mengembalikan HTML (mungkin redirect/login).";
  // String biasa
  if (typeof raw === "string" && raw.trim()) return raw.slice(0, 200);
  return undefined;
}

const DEV = import.meta.env?.DEV === true;

function logApiError(where: string, ax: AxiosErr) {
  if (!DEV) return;
  const st = ax?.response?.status;
  const data = ax?.response?.data;
  const kind =
    typeof data === "string"
      ? (isHtmlPayload(data) ? "html" : "text")
      : (data && typeof data === "object" ? "json" : typeof data);
  console.groupCollapsed(`[api] ❌ ${where} status=${st ?? "-"} kind=${kind}`);
  console.log("raw error:", ax);
  if (typeof data === "string") {
    console.log("data(text):", data.slice(0, 400));
  } else {
    console.log("data(json):", data);
  }
  console.groupEnd();
}

function onApi<T>(p: Promise<T>): Promise<T> {
  return p.catch((err: unknown) => {
    if (isCancelLike(err)) throw err; // biarkan komponen yang mengabaikan

    const ax = err as AxiosErr;
    const status = ax?.response?.status;
    const data = ax?.response?.data;
    const msgFromData = pickMessageFromResponse(data);
    logApiError("onApi", ax);

    // Pesan default yang lebih informatif berdasar status umum
    let fallback = "Terjadi kesalahan pada server.";
    if (status === 401) fallback = "Tidak terautentikasi (401).";
    else if (status === 403) fallback = "Tidak punya izin (403).";
    else if (status === 419) fallback = "Sesi kedaluwarsa (419).";
    else if (status === 404) fallback = "Tidak ditemukan (404).";

    const apiErr: ApiError = {
      status,
      message: msgFromData ?? fallback,
      errors: (typeof data === "object" && data !== null
        ? (data as { errors?: Record<string, string[]> }).errors
        : undefined),
    };
    throw apiErr;
  });
}

/** Type guard untuk respons berbentuk envelope `{ data: T }` */
function isEnvelope<T>(x: unknown): x is { data: T } {
  return !!x && typeof x === "object" && "data" in x;
}

// =================== PRODUCTS ===================

// GET /products
export function listProducts(
  q: ProductQuery = {},
  init?: { signal?: AbortSignal }
): Promise<PaginatedResponse<Product>> {
  const params = {
    q: q.search,
    category_id: q.category_id,
    is_active: toBoolNum(q.is_active),
    page: q.page,
    per_page: q.per_page,
    sort: q.sort,
    // gudang_id: q.gudang_id,  // sengaja dimatikan
    // cabang_id: q.cabang_id,
  };

  // 🔎 Log URL final  params (dev only)
  if (DEV) {
    const cfg = { url: "/products", method: "get" as const, params };
    // getUri mungkin tidak ada di adapter custom; cek dulu
    const uri =
      typeof (api as unknown as { getUri?: (c: typeof cfg) => string }).getUri === "function"
        ? (api as unknown as { getUri: (c: typeof cfg) => string }).getUri(cfg)
        : `/products?${new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()}`;
    console.groupCollapsed("[api] ▶ GET /products");
    console.log("url:", uri);
    console.log("params:", params);
    // coba tampilkan header default instance bila ada
    const d = (api.defaults ?? {}) as { headers?: Record<string, unknown> };
    if (d.headers && typeof d.headers === "object") {
      const h = d.headers as Record<string, unknown>;
      console.log("default headers.Accept:", h["Accept"]);
      console.log("default headers.Authorization:", h["Authorization"]);
    }
    console.groupEnd();
  }

  return onApi(
    api.get<PaginatedResponse<Product>>("/products", {
      params,
      signal: init?.signal,
    }).then((r) => {
      const paged: PaginatedResponse<Product> = r.data;
      const data = Array.isArray(paged?.data) ? paged.data.map(withImageUrl) : [];
      return { ...paged, data };
    })
  );
}

// GET /products/:id
export function getProduct(id: number): Promise<Product> {
  return onApi(
    api.get<Product | { data: Product }>(`/products/${id}`).then((r) => {
      const raw = isEnvelope<Product>(r.data) ? r.data.data : r.data;
      return withImageUrl(raw);
    })
  );
}

// POST /products
export function createProduct(payload: ProductCreatePayload): Promise<{ data: Product }> {
  return onApi(api.post<{ data: Product }>("/products", payload).then((r) => r.data));
}

// PUT /products/:id
export function updateProduct(id: number, payload: ProductUpdatePayload): Promise<{ data: Product }> {
  return onApi(api.put<{ data: Product }>(`/products/${id}`, payload).then((r) => r.data));
}

// DELETE /products/:id (hard delete)
export function deleteProduct(id: number): Promise<{ message: string }> {
  return onApi(api.delete<{ message: string }>(`/products/${id}`).then((r) => r.data));
}

// =================== VARIANTS ===================
// Konvensi: nested di bawah product
// GET /products/:productId/variants
type ApiVariant = Omit<ProductVariant, "harga"> & { harga: string | number | null };

export async function listVariants(
  productId: number,
  init?: { signal?: AbortSignal }                    // <-- added
): Promise<ProductVariant[]> {
  const res = await api.get<ApiVariant[] | { data: ApiVariant[] }>(
    `/products/${productId}/variants`,
    { signal: init?.signal }                         // <-- added
  );

  const raw = res?.data;
  const list: ApiVariant[] = Array.isArray(raw)
    ? raw
    : raw && Array.isArray((raw as { data: ApiVariant[] }).data)
      ? (raw as { data: ApiVariant[] }).data
      : [];

  return list.map((v): ProductVariant => ({
    ...v,
    harga: Number(v.harga ?? 0),
  }));
}
// POST /products/:productId/variants
export function createVariant(
  productId: number,
  payload: VariantCreatePayload
): Promise<{ data: ProductVariant }> {
  return onApi(api.post<{ data: ProductVariant }>(`/products/${productId}/variants`, payload).then((r) => r.data));
}

// PUT /products/:productId/variants/:variantId
export function updateVariant(
  productId: number,
  variantId: number,
  payload: VariantUpdatePayload
): Promise<{ data: ProductVariant }> {
  return onApi(api.put<{ data: ProductVariant }>(`/products/${productId}/variants/${variantId}`, payload).then((r) => r.data));
}

// DELETE /products/:productId/variants/:variantId
export function deleteVariant(productId: number, variantId: number): Promise<{ message: string }> {
  return onApi(api.delete<{ message: string }>(`/products/${productId}/variants/${variantId}`).then((r) => r.data));
}

// =================== MEDIA ===================
// GET /products/:productId/media
export function listMedia(productId: number): Promise<ProductMedia[]> {
  return onApi(api.get<ProductMedia[]>(`/products/${productId}/media`).then((r) => r.data));
}

// POST /products/:productId/media (multipart/form-data)
// - files[]: FileList atau File[]
// - optional: sort_order (number[]) jika ingin set urutan awal
export function uploadMedia(productId: number, files: File[] | FileList): Promise<MediaUploadResult> {
  const fd = new FormData();
  const arr = Array.from(files as File[]).filter(Boolean);
  if (arr.length === 0) throw { message: "Pilih minimal 1 file gambar." };

  // WAJIB: hanya 'files[]'
  arr.forEach((f) => fd.append("files[]", f));

  // JANGAN set Content-Type manual, biar browser set boundary.
  return onApi(api.post<MediaUploadResult>(`/products/${productId}/media`, fd).then((r) => r.data));
}

// PUT /products/:productId/media/set-primary
export function setPrimaryMedia(productId: number, mediaId: number): Promise<{ message: string }> {
  return onApi(
    api.post<{ message: string }>(`/products/${productId}/media/set-primary`, { media_id: mediaId }).then((r) => r.data)
  );
}

function withImageUrl<T extends Product>(p: T): T {
  if ((p).image_url) return p; // backend already provides it
  const primary = p.media?.find((m) => m.is_primary)?.path;
  const first = p.media?.[0]?.path;
  const url = mediaPathToUrl(primary || first);
  return { ...p, image_url: url };
}

// PUT /products/:productId/media/:mediaId (ubah urutan / flag)
export function updateMedia(
  productId: number,
  mediaId: number,
  payload: Partial<Pick<ProductMedia, "sort_order" | "is_primary">>
): Promise<{ data: ProductMedia }> {
  return onApi(api.put<{ data: ProductMedia }>(`/products/${productId}/media/${mediaId}`, payload).then((r) => r.data));
}

// DELETE /products/:productId/media/:mediaId
export function deleteMedia(productId: number, mediaId: number): Promise<{ message: string }> {
  return onApi(api.delete<{ message: string }>(`/products/${productId}/media/${mediaId}`).then((r) => r.data));
}
