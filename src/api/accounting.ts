// src/api/accounting.ts
import { api } from "./client";
import type {
    ID,
    Account,
    AccountCreatePayload,
    AccountUpdatePayload,
    JournalEntry,
    JournalCreatePayload,
    JournalUpdatePayload,
    FiscalPeriod,
    TrialBalanceRow,
    GLRow,
    ProfitLossAgg,
    ReportQuery,
} from "../types/accounting";
import type { Paginated } from "../types/http";

// ========== Accounts ==========
export async function listAccounts(params?: {
    q?: string;
    cabang_id?: ID;
    is_active?: boolean;
    page?: number;
    per_page?: number;
}): Promise<Paginated<Account>> {
    const { data } = await api.get<Paginated<Account>>("/accounting/accounts", {
        params,
    });
    return data;
}

export async function createAccount(payload: AccountCreatePayload) {
    const { data } = await api.post<Account>("/accounting/accounts", payload);
    return data;
}

export async function updateAccount(id: ID, payload: AccountUpdatePayload) {
    const { data } = await api.put<Account>(`/accounting/accounts/${id}`, payload);
    return data;
}

export async function deleteAccount(id: ID) {
    await api.delete(`/accounting/accounts/${id}`);
}

// ========== Journals ==========
export async function listJournals(params?: {
    cabang_id?: ID;
    status?: "DRAFT" | "POSTED";
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
    q?: string;
}): Promise<Paginated<JournalEntry>> {
    const resp = await api.get("/accounting/journals", { params });
    const payload = resp.data;

    if (Array.isArray(payload?.data)) {
        return payload as Paginated<JournalEntry>;
    }

    const paginator = payload?.data;
    if (paginator && Array.isArray(paginator.data)) {
        const normalized: Paginated<JournalEntry> = {
            data: paginator.data,
            meta: {
                current_page: paginator.current_page ?? paginator.currentPage ?? 1,
                per_page: paginator.per_page ?? paginator.perPage ?? paginator.per_page ?? 20,
                total: paginator.total ?? 0,
                last_page: paginator.last_page ?? paginator.lastPage ?? 1,
            },
        };
        return normalized;
    }

    return { data: Array.isArray(payload) ? payload : [], meta: { current_page: 1, per_page: 0, total: 0, last_page: 1 } };
}

export async function createJournal(payload: JournalCreatePayload) {
    const { data } = await api.post<JournalEntry>("/accounting/journals", payload);
    return data;
}

export async function updateJournal(id: ID, payload: JournalUpdatePayload) {
    const { data } = await api.put<JournalEntry>(`/accounting/journals/${id}`, payload);
    return data;
}

export async function postJournal(id: ID) {
    const { data } = await api.post<JournalEntry>(`/accounting/journals/${id}/post`, {});
    return data;
}

export async function deleteJournal(id: ID) {
    await api.delete(`/accounting/journals/${id}`);
}

// ========== Periods ==========
export async function listPeriods(params?: { cabang_id?: ID; year?: number }) {
    const { data } = await api.get<FiscalPeriod[]>("/accounting/periods", { params });
    return data;
}

export async function openPeriod(payload: { cabang_id: ID; year: number; month: number }) {
    const { data } = await api.post<FiscalPeriod>("/accounting/periods/open", payload);
    return data;
}

export async function closePeriod(payload: { cabang_id: ID; year: number; month: number }) {
    const { data } = await api.post<FiscalPeriod>("/accounting/periods/close", payload);
    return data;
}

const toNum = (v: unknown) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
};

// ========== Reports ==========
export async function getTrialBalance(q: ReportQuery) {
    const resp = await api.get("/accounting/reports/trial-balance", { params: q });
    const rows = Array.isArray(resp.data?.data) ? resp.data.data : resp.data;
    // pastikan debit/credit number
    return (rows as TrialBalanceRow[]).map(r => ({
        ...r,
        debit: toNum((r as any).debit),
        credit: toNum((r as any).credit),
    }));
}

export async function getGeneralLedger(q: ReportQuery & { account_id: ID }) {
    const resp = await api.get("/accounting/reports/general-ledger", { params: q });
    const rows = Array.isArray(resp.data?.data) ? resp.data.data : resp.data;
    return (rows as GLRow[]).map(r => ({
        ...r,
        debit: toNum((r as any).debit),
        credit: toNum((r as any).credit),
        balance: toNum((r as any).balance),
    }));
}

export async function getProfitLoss(q: ReportQuery): Promise<ProfitLossAgg> {
    const resp = await api.get("/accounting/reports/profit-loss", { params: q });

    // raw = objek hasil backend, contoh: { Revenue: {debit:"0.00", credit:"123.45"}, Expense: {...} }
    const raw = (resp.data?.data ?? resp.data) as Record<string, { debit: unknown; credit: unknown }>;

    // Bangun object dengan index signature terlebih dulu (legal untuk diindex pakai string)
    const out: Record<string, { debit: number; credit: number }> = {};

    for (const [k, v] of Object.entries(raw)) {
        out[k] = {
            debit: toNum(v?.debit),
            credit: toNum(v?.credit),
        };
    }

    // Kembalikan sebagai ProfitLossAgg (biarkan komponen tetap pakai tipe lamamu)
    return out as unknown as ProfitLossAgg;
}

export async function getBalanceSheet(q: ReportQuery) {
    const resp = await api.get("/accounting/reports/balance-sheet", { params: q });
    const obj = (resp.data?.data ?? resp.data) as Record<string, number | string>;
    const out: Record<string, number> = {};
    for (const k of Object.keys(obj)) out[k] = toNum((obj as any)[k]);
    return out;
}
