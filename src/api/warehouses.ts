import { api } from "../api/client";
import type {
  WarehouseListResponse,
  WarehouseDetailResponse,
  WarehouseCreatePayload,
  WarehouseUpdatePayload,
  WarehouseQuery,
} from "../types/warehouse";

const base = "/gudangs";

export async function listWarehouses(query?: WarehouseQuery): Promise<WarehouseListResponse> {
  const { data } = await api.get<WarehouseListResponse>(base, { params: query });
  return data;
}

export async function getWarehouse(id: number): Promise<WarehouseDetailResponse> {
  const { data } = await api.get<WarehouseDetailResponse>(`${base}/${id}`);
  return data;
}

export async function createWarehouse(payload: WarehouseCreatePayload): Promise<WarehouseDetailResponse> {
  const { data } = await api.post<WarehouseDetailResponse>(base, payload);
  return data;
}

export async function updateWarehouse(id: number, payload: WarehouseUpdatePayload): Promise<WarehouseDetailResponse> {
  const { data } = await api.put<WarehouseDetailResponse>(`${base}/${id}`, payload);
  return data;
}

export async function deleteWarehouse(id: number): Promise<void> {
  await api.delete(`${base}/${id}`);
}
