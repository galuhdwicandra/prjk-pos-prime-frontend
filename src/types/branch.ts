import type { Warehouse } from "./warehouse";

export type Branch = {
  id: number;
  nama: string;
  kota: string;
  alamat: string;
  telepon: string | null;
  jam_operasional: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  gudangs?: Warehouse[];
};

// ikut pola meta di proyekmu (samakan dengan Users)
export type PaginatedMeta = {
  current_page: number;
  per_page: number | string;
  total: number;
  last_page: number;
};

export type BranchListResponse = {
  success: boolean;
  data: Branch[];
  meta: PaginatedMeta;
};

export type BranchDetailResponse = {
  success: boolean;
  data: Branch;
};

export type BranchQuery = {
  q?: string;
  kota?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number | string;
  sort?: string; // "-id" | "id" | "nama" | "kota" | "is_active" | "created_at"
};

export type BranchCreatePayload = {
  nama: string;
  kota: string;
  alamat: string;
  telepon?: string | null;
  jam_operasional?: string | null;
  is_active?: boolean;
};

export type BranchUpdatePayload = Partial<BranchCreatePayload>;
