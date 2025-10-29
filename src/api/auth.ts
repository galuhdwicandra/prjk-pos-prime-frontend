// src/api/auth.ts
import { api, setAuthToken } from "./client";
import type { LoginPayload, LoginResponse } from "../types/auth";
import type { User } from "../types/user";

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  // Backend mengembalikan { token, token_type: "Bearer", user }
  setAuthToken(data.token);
  return data;
}

export async function me(): Promise<User> {
  const { data } = await api.get<{ user: User }>("/auth/me");
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
  setAuthToken(null);
}
