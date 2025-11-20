// src/types/fees.ts
export type ID = number;

export type FeeKind = "SALES" | "CASHIER" | "COURIER";
export type FeeCalcType = "PERCENT" | "FIXED";
export type FeeBase = "GRAND_TOTAL" | "DELIVERY";

export type Fee = {
    id: ID;
    cabang_id: ID;
    name: string;
    kind: FeeKind;
    calc_type: FeeCalcType;
    rate: number; // numeric(10,2)
    base: FeeBase;
    is_active: boolean;
    created_at?: string | null;
    updated_at?: string | null;
};

export type FeeCreatePayload = {
    cabang_id: ID;
    name: string;
    kind: FeeKind;
    calc_type: FeeCalcType;
    rate: number;
    base: FeeBase;
    is_active: boolean;
};

export type FeeUpdatePayload = Partial<FeeCreatePayload>;

export type FeeQuery = Partial<{
    page: number;
    per_page: number;
    q: string;
    cabang_id: ID;
    kind: FeeKind;
    base: FeeBase;
    is_active: boolean;
    sort: "name" | "-name" | "created_at" | "-created_at";
}>;

export type PaginatedMeta = {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
};

export type PaginatedResponse<T> = {
    data: T[];
    meta: PaginatedMeta;
};
