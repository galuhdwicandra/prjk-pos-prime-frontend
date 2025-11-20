// src/api/users.ts
import { api } from "./client";
import type { Paginated } from "../types/http";
import type { Role, User } from "../types/user";

export interface UsersQuery {
  q?: string;
  role?: Role;
  cabang_id?: number;
  is_active?: boolean;
  per_page?: number;
  page?: number;
}

type Meta = Paginated<unknown>["meta"];

type RawPaginator<T> = {
  data: T[];
  current_page?: number;
  per_page?: number | string;
  total?: number;
  last_page?: number;
} & Record<string, unknown>;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function isNumberLike(v: unknown): v is number | string {
  return typeof v === "number" || typeof v === "string";
}
function asNumber(v: unknown, fallback: number): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function hasMeta<T>(v: unknown): v is Paginated<T> {
  if (!isRecord(v)) return false;
  const meta = v.meta;
  if (!isRecord(meta)) return false;
  return (
    isNumberLike(meta.current_page) &&
    isNumberLike(meta.per_page) &&
    isNumberLike(meta.total) &&
    isNumberLike(meta.last_page) &&
    Array.isArray((v as { data: unknown }).data)
  );
}

function looksLikeRawPaginator<T>(v: unknown): v is RawPaginator<T> {
  if (!isRecord(v)) return false;
  return Array.isArray(v.data) && (
    "current_page" in v || "per_page" in v || "total" in v || "last_page" in v
  );
}

function normalizeMeta(m: Partial<Meta>): Meta {
  return {
    current_page: asNumber(m.current_page, 1),
    per_page: asNumber(m.per_page, 10),
    total: asNumber(m.total, Array.isArray((m as unknown as { data: unknown[] }).data) ? (m as unknown as { data: unknown[] }).data.length : 0),
    last_page: asNumber(m.last_page, 1),
  };
}

function toPaginated<T>(raw: unknown): Paginated<T> {
  // Case 1: backend sudah { data, meta }
  if (hasMeta<T>(raw)) {
    // pastikan angka dipaksa number (kalau server kirim string)
    return {
      data: raw.data,
      meta: normalizeMeta(raw.meta),
    };
  }

  // Case 2: Laravel paginator klasik (top-level current_page/last_page)
  if (looksLikeRawPaginator<T>(raw)) {
    const r = raw as RawPaginator<T>;
    return {
      data: (Array.isArray(r.data) ? r.data : []) as T[],
      meta: normalizeMeta({
        current_page: asNumber(r.current_page, 1),
        per_page: asNumber(r.per_page, 10),
        total: asNumber(r.total, Array.isArray(r.data) ? r.data.length : 0),
        last_page: asNumber(r.last_page, 1),
      }),
    };
  }

  // Case 3: fallback aman
  return {
    data: [],
    meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 },
  };
}

export interface CreateUserPayload {
  name: string;
  email: string;
  phone?: string | null;
  password: string;
  cabang_id?: number | null;
  role: Role;
  is_active?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string; // opsional; kalau kosong jangan kirim
  cabang_id?: number | null;
  role?: Role;
  is_active?: boolean;
}

export async function listUsers(q: UsersQuery = {}): Promise<Paginated<User>> {
  const { data } = await api.get<unknown>("/users", { params: q });
  return toPaginated<User>(data);
}

export async function getUser(id: number): Promise<User> {
  const { data } = await api.get<User>(`/users/${id}`);
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await api.post<User>("/users", payload);
  return data;
}

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
  const { data } = await api.put<User>(`/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}
