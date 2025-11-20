// src/types/cash.ts
import type { ID } from "./pos";
export type { ID } from "./pos";
import type { PaginatedMeta } from "./http";

/** Cash holder = “where the cash is” (till, safe, bank) per branch */
export type CashHolderType = "TILL" | "SAFE" | "BANK";
export type CashHolder = {
    id: ID;
    branch_id: ID;
    name: string;
    balance: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
};

export type CashHolderQuery = Partial<{
    q: string;
    branch_id: ID;
    is_active: boolean;
    page: number;
    per_page: number;
    sort?: string;
}>;

export type CashHoldersPaged = { data: CashHolder[]; meta: PaginatedMeta };

export type CashMoveStatus = "SUBMITTED" | "APPROVED" | "REJECTED";

export type CashMove = {
    id: ID;
    from_holder_id: ID;
    to_holder_id: ID;
    amount: number;
    status: CashMoveStatus;
    note?: string | null;
    submitted_by: ID;
    approved_by?: ID | null;
    submitted_at: string;
    approved_at?: string | null;
    reject_reason?: string | null;
    created_at?: string;
    updated_at?: string;

    // embeds (optional from backend)
    from_holder?: { id: ID; name: string };
    to_holder?: { id: ID; name: string };
};

export type CashMoveQuery = Partial<{
    q: string;                  // holder name / note
    holder_id: ID;              // either from/to
    status: CashMoveStatus;
    branch_id: ID;
    date_from: string;          // YYYY-MM-DD
    date_to: string;            // YYYY-MM-DD
    page: number;
    per_page: number;
    sort?: string;
}>;

export type CashMovesPaged = { data: CashMove[]; meta: PaginatedMeta };

export type SubmitCashPayload = {
    from_holder_id: ID;
    to_holder_id: ID;
    amount: number;
    note?: string | null;
    moved_at: string;           // ISO string required by backend
    idempotency_key?: string;
};

export type RejectCashPayload = { reason: string };
