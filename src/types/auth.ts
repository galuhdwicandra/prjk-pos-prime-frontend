// src/types/auth.ts
import type { User } from "./user";

export type Role =
  | "Superadmin"
  | "Admin Cabang"
  | "Kasir"
  | "Sales"
  | "Kurir"
  | "Washerman";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;          // "Bearer" token string
  token_type: "Bearer";   // backend kirim "Bearer"
  user: User;             // profil user aktif
}
