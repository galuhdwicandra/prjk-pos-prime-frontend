// src/api/cash.ts
import { api } from "./client";
import type {
    CashHolder, CashHoldersPaged, CashHolderQuery,
    CashMove, CashMovesPaged, CashMoveQuery,
    SubmitCashPayload, RejectCashPayload, ID
} from "../types/cash";

/** Query-string builder (keeps undefined/null/"" out) */
function toQuery(params: Record<string, unknown>): string {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        usp.set(k, String(v));
    });
    const q = usp.toString();
    return q ? `?${q}` : "";
}

type LaravelPaginator<T> = {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    data: T[];
};

/* -------------------- HOLDERS -------------------- */

export async function listCashHolders(q: CashHolderQuery = {}): Promise<CashHoldersPaged> {
    const { data } = await api.get<LaravelPaginator<{ id: ID; cabang_id: ID; name: string; balance: string; is_active?: boolean }>>(
        `/cash/holders${toQuery(q)}`
    );
    return {
        data: data.data.map((h) => ({
            id: h.id,
            branch_id: h.cabang_id,
            name: h.name,
            balance: Number(h.balance),
            is_active: h.is_active ?? true,
        })),
        meta: {
            current_page: data.current_page,
            per_page: data.per_page,
            total: data.total,
            last_page: data.last_page,
        },
    };
}

export async function getCashHolder(id: ID): Promise<{ data: CashHolder }> {
    const { data } = await api.get<{ id: ID; cabang_id: ID; name: string; balance: string; is_active?: boolean }>(
        `/cash/holders/${id}`
    );
    return {
        data: {
            id: data.id,
            branch_id: data.cabang_id,
            name: data.name,
            balance: Number(data.balance),
            is_active: data.is_active ?? true,
        },
    };
}

/* -------------------- MOVES (submit / approve / reject) -------------------- */

export async function listCashMoves(q: CashMoveQuery = {}): Promise<CashMovesPaged> {
    const { data } = await api.get<LaravelPaginator<{
        id: ID;
        from_holder_id: ID;
        to_holder_id: ID;
        amount: string;
        status: "SUBMITTED" | "APPROVED" | "REJECTED";
        note?: string | null;
        submitted_by: ID;
        approved_by?: ID | null;
        submitted_at?: string; // backend may name timestamps slightly differently; we map defensively
        approved_at?: string | null;
        reject_reason?: string | null;
        moved_at?: string;
        from?: { id: ID; name: string } | null;
        to?: { id: ID; name: string } | null;
    }>>(`/cash/moves${toQuery(q)}`);
    return {
        data: data.data.map((m) => ({
            id: m.id,
            from_holder_id: m.from_holder_id,
            to_holder_id: m.to_holder_id,
            amount: Number(m.amount),
            status: m.status,
            note: m.note ?? null,
            submitted_by: m.submitted_by,
            approved_by: m.approved_by ?? null,
            // prefer explicit fields, fallback to moved_at when needed
            submitted_at: m.submitted_at ?? m.moved_at ?? "",
            approved_at: m.approved_at ?? null,
            reject_reason: m.reject_reason ?? null,
            from_holder: m.from ? { id: m.from.id, name: m.from.name } : undefined,
            to_holder: m.to ? { id: m.to.id, name: m.to.name } : undefined,
        })),
        meta: {
            current_page: data.current_page,
            per_page: data.per_page,
            total: data.total,
            last_page: data.last_page,
        },
    };
}

export async function submitCash(payload: SubmitCashPayload): Promise<{ message: string; data: CashMove }> {
    const { data } = await api.post(`/cash/moves`, payload);
    return { message: "Created", data };
}

export async function approveCashMove(id: ID): Promise<{ message: string; data: CashMove }> {
    const { data } = await api.post(`/cash/moves/${id}/approve`, {});
    return { message: "Approved", data };
}

export async function rejectCashMove(id: ID, payload: RejectCashPayload): Promise<{ message: string; data: CashMove }> {
    const { data } = await api.post(`/cash/moves/${id}/reject`, payload);
    return { message: "Rejected", data };
}

export async function getCashMove(id: ID): Promise<{ data: CashMove }> {
    const { data } = await api.get(`/cash/moves/${id}`);
    return { data };
}