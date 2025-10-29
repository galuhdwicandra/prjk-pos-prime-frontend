// src/api/categories.ts
import type {
  Category,
  CategoryCreatePayload,
  CategoryID,
  CategoryQuery,
  CategoryUpdatePayload,
  PaginatedResponse,
  ApiError,
} from "../types/category";
import { getAuthToken } from "../api/client";

/**
 * Ambil base URL dari .env (tanpa slash akhir).
 * Contoh: VITE_API_URL="http://localhost:8000/api/v1"
 */
const ENV = (import.meta).env ?? {};
const RAW = ENV.VITE_API_URL ?? ENV.VITE_API_BASE_URL;
if (!RAW) {
  throw new Error(
    'VITE_API_URL / VITE_API_BASE_URL belum diset. Tambahkan VITE_API_URL="http://localhost:8000/api/v1" di .env frontend lalu restart Vite.'
  );
}
const BASE_URL = String(RAW).replace(/\/+$/, "");

/** Inject Authorization dari storage */
function authHeader(): HeadersInit {
  const t = getAuthToken() ?? "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function toQuery(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    usp.set(k, String(v));
  });
  const q = usp.toString();
  return q ? `?${q}` : "";
}

async function handle<T>(res: Response): Promise<T> {
  if (res.ok) return (await res.json()) as T;

  let message = res.statusText;
  let errors: Record<string, string[]> | undefined;
  try {
    const body = await res.json();
    message = body?.message ?? message;
    errors = body?.errors;
  } catch {
    /* body bukan JSON */
  }

  const err: ApiError = { status: res.status, message, errors };
  throw err;
}

/** List Kategori: GET /categories?search&is_active&page&per_page&sort */
export async function listCategories(
  query: CategoryQuery = {}
): Promise<PaginatedResponse<Category>> {
  const url =
    `${BASE_URL}/categories` +
    toQuery({
      search: query.search,
      is_active:
        typeof query.is_active === "boolean"
          ? query.is_active
            ? 1
            : 0
          : undefined,
      page: query.page,
      per_page: query.per_page,
      sort: query.sort,
    });

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...authHeader(),
    },
  });

  return handle<PaginatedResponse<Category>>(res);
}

/** Detail: GET /categories/:id */
export async function getCategory(id: CategoryID): Promise<{ data: Category }> {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...authHeader(),
    },
  });
  return handle<{ data: Category }>(res);
}

/** Create: POST /categories */
export async function createCategory(
  payload: CategoryCreatePayload
): Promise<{ data: Category }> {
  const res = await fetch(`${BASE_URL}/categories`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  });
  return handle<{ data: Category }>(res);
}

/** Update: PUT /categories/:id */
export async function updateCategory(
  id: CategoryID,
  payload: CategoryUpdatePayload
): Promise<{ data: Category }> {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  });
  return handle<{ data: Category }>(res);
}

/** Delete (hard): DELETE /categories/:id */
export async function deleteCategory(
  id: CategoryID
): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...authHeader(),
    },
  });
  return handle<{ message: string }>(res);
}
