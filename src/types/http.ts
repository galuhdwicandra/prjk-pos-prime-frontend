// src/types/http.ts
export interface PaginatedMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginatedMeta;
}

export type ServerValidationErrors = Record<string, string[]>;

export interface ApiErrorPayload {
  message?: string;
  errors?: ServerValidationErrors;
}
