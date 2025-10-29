import { api } from "../api/client";
import type {
  BranchListResponse,
  BranchDetailResponse,
  BranchCreatePayload,
  BranchUpdatePayload,
  BranchQuery,
} from "../types/branch";

const base = "/cabangs";

export async function listBranches(query?: BranchQuery): Promise<BranchListResponse> {
  const { data } = await api.get<BranchListResponse>(base, { params: query });
  return data;
}

export async function getBranch(id: number): Promise<BranchDetailResponse> {
  const { data } = await api.get<BranchDetailResponse>(`${base}/${id}`);
  return data;
}

export async function createBranch(payload: BranchCreatePayload): Promise<BranchDetailResponse> {
  const { data } = await api.post<BranchDetailResponse>(base, payload);
  return data;
}

export async function updateBranch(id: number, payload: BranchUpdatePayload): Promise<BranchDetailResponse> {
  const { data } = await api.put<BranchDetailResponse>(`${base}/${id}`, payload);
  return data;
}

export async function deleteBranch(id: number): Promise<void> {
  await api.delete(`${base}/${id}`);
}
