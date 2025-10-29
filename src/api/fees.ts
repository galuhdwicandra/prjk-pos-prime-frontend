// src/api/fees.ts
import { api } from "./client";
import type {
    Fee,
    FeeQuery,
    FeeCreatePayload,
    FeeUpdatePayload,
    PaginatedResponse,
} from "../types/fees";

function cleanParams<T extends Record<string, unknown>>(raw: T): Record<string, string> {
    const out: Record<string, string> = {};
    Object.entries(raw).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        out[k] = String(v);
    });
    return out;
}

export async function listFees(query: FeeQuery): Promise<PaginatedResponse<Fee>> {
    const { data } = await api.get<PaginatedResponse<Fee>>("/fees", {
        params: cleanParams(query),
    });
    return data;
}

export async function getFee(id: number): Promise<Fee> {
    const { data } = await api.get<{ data: Fee }>(`/fees/${id}`);
    return data.data;
}

export async function createFee(payload: FeeCreatePayload): Promise<Fee> {
    const { data } = await api.post<{ data: Fee; message: string }>("/fees", payload);
    return data.data;
}

export async function updateFee(id: number, payload: FeeUpdatePayload): Promise<Fee> {
    const { data } = await api.put<{ data: Fee; message: string }>(`/fees/${id}`, payload);
    return data.data;
}

export async function deleteFee(id: number): Promise<void> {
    await api.delete(`/fees/${id}`);
}
