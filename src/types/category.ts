// src/types/category.ts

export type CategoryID = number;

export type SortCategory =
  | "nama"
  | "-nama"
  | "created_at"
  | "-created_at";

export interface Category {
  id: CategoryID;
  nama: string;
  slug: string;
  deskripsi: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  /** Opsional: jika API menambahkan agregat jumlah produk per kategori */
  products_count?: number;
}

export interface CategoryCreatePayload {
  nama: string;
  deskripsi?: string;
  is_active?: boolean;
  slug?: string;
}

export interface CategoryUpdatePayload {
  nama?: string;
  deskripsi?: string | null;
  is_active?: boolean;
  slug?: string;
}

export interface CategoryQuery {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
  sort?: SortCategory;
}

/** Laravel Paginator (disederhanakan biar aman dipakai lintas modul) */
export interface PaginatedMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}
