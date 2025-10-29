// src/api/client.ts
import axios from "axios";
import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
} from "axios";
import { AxiosHeaders } from "axios";
import type { ApiErrorPayload } from "../types/http";

const TOKEN_KEY = "pp_auth_token";

// --- Strict base resolver (no fallback to :5173) ---
export function getBaseUrl(): string {
  const raw =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    (import.meta.env.VITE_API_URL as string | undefined) ??
    "";

  const base = raw.replace(/\/+$/, "");
  if (!base) {
    throw new Error(
      "VITE_API_BASE_URL belum diset. Tambahkan ke frontend/.env lalu restart Vite. " +
      'Contoh: VITE_API_BASE_URL="http://localhost:8000/api/v1"'
    );
  }
  if (/^https?:\/\/(localhost|127\.0\.0\.1):5173(\/|$)/i.test(base)) {
    throw new Error(
      "BASE URL salah (mengarah ke :5173). Harusnya http://localhost:8000/api/v1 atau gunakan proxy Vite."
    );
  }
  return base;
}

const BASE = getBaseUrl();

let token: string | null =
  typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

export function setAuthToken(next: string | null): void {
  token = next;
  if (typeof localStorage !== "undefined") {
    if (next) localStorage.setItem(TOKEN_KEY, next);
    else localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAuthToken(): string | null {
  return token;
}

// Axios instance with sane defaults
export const api: AxiosInstance = axios.create({
  baseURL: BASE, // e.g., http://localhost:8000/api/v1
  withCredentials: false,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    // Keep Accept on every request, even unauthenticated ones.
    Accept: "application/json",
  },
});

// --- Helper to set Authorization safely in Axios v1 ---
function setAuthHeader(
  headers: AxiosRequestHeaders | undefined,
  bearer: string
): AxiosRequestHeaders | undefined {
  if (!headers) return headers;
  if (headers instanceof AxiosHeaders) {
    headers.set("Authorization", `Bearer ${bearer}`);
    // Accept is already defaulted above; keep it consistent:
    headers.set("Accept", "application/json");
    return headers;
  }
  (headers as Record<string, string>)["Authorization"] = `Bearer ${bearer}`;
  (headers as Record<string, string>)["Accept"] = "application/json";
  return headers;
}

// Attach Authorization if token exists
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const t = getAuthToken();
  if (t) {
    config.headers = (config.headers ?? new AxiosHeaders()) as AxiosRequestHeaders;
    setAuthHeader(config.headers, t);
  } else {
    // Ensure Accept remains present even without token
    const h = (config.headers ?? new AxiosHeaders()) as AxiosRequestHeaders;
    if (h instanceof AxiosHeaders) h.set("Accept", "application/json");
    else (h as Record<string, string>)["Accept"] = "application/json";
    config.headers = h;
  }
  return config;
});

// Common error handling
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiErrorPayload>) => {
    if (err.response?.status === 401) {
      setAuthToken(null);
    }
    return Promise.reject(err);
  }
);
