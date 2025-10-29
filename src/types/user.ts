// src/types/user.ts
export type Role =
  | "superadmin"
  | "admin_cabang"
  | "gudang"
  | "kasir"
  | "sales"
  | "kurir";

export type ID = number;

export type Nullable<T> = T | null;

export interface User {
  id: ID;
  name: string;
  email: string;
  phone: Nullable<string>;
  cabang_id: Nullable<number>;
  role: Role;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
