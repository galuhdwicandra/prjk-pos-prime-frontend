// src/types/accounting.ts
// Keep IDs nominal & explicit
export type ID = number;

export type AccountType =
    | "Asset"
    | "Liability"
    | "Equity"
    | "Revenue"
    | "Expense";

export type NormalBalance = "DEBIT" | "CREDIT";

export type Account = {
    id: ID;
    cabang_id: ID;
    code: string;
    name: string;
    type: AccountType;
    normal_balance: NormalBalance;
    parent_id: ID | null;
    is_active: boolean;
    created_at?: string | null;
    updated_at?: string | null;
};

export type AccountCreatePayload = {
    cabang_id: ID | null;
    code: string;
    name: string;
    type: AccountType;
    normal_balance: NormalBalance;
    parent_id?: ID | null;
    is_active: boolean;
};

export type AccountUpdatePayload = Partial<AccountCreatePayload>;

export type JournalStatus = "DRAFT" | "POSTED";

export type JournalLine = {
    account_id: ID;
    cabang_id: ID;
    debit: number;   // numeric(18,2) — never negative
    credit: number;  // numeric(18,2) — never negative
    ref_type?: string | null;
    ref_id?: ID | null;
};

export type JournalEntry = {
    id: ID;
    cabang_id: ID;
    journal_date: string; // YYYY-MM-DD
    number: string;
    description?: string | null;
    status: JournalStatus;
    period_year: number;  // smallint
    period_month: number; // smallint 1..12
    lines?: (JournalLine & { id?: ID })[];
    created_at?: string | null;
    updated_at?: string | null;
};

export type JournalCreatePayload = {
    cabang_id: ID;
    journal_date: string;
    number: string;
    description?: string | null;
    lines: JournalLine[];
};

export type JournalUpdatePayload = Partial<JournalCreatePayload>;

export type FiscalPeriod = {
    id: ID;
    cabang_id: ID;
    year: number;
    month: number;
    status: "OPEN" | "CLOSED";
    created_at?: string | null;
    updated_at?: string | null;
};

export type PeriodOpenPayload = { cabang_id: ID; year: number; month: number };
export type PeriodClosePayload = PeriodOpenPayload;

export type TrialBalanceRow = {
    id: ID;
    code: string;
    name: string;
    type: AccountType;
    normal_balance: NormalBalance;
    debit: number;
    credit: number;
};

export type GLRow = {
    number: string;
    journal_date: string;
    debit: number;
    credit: number;
    ref_type?: string | null;
    ref_id?: ID | null;
};

export type ProfitLossAgg = {
    Revenue?: { debit: number; credit: number };
    Expense?: { debit: number; credit: number };
};

export type ReportQuery = Partial<{
    cabang_id: ID;
    year: number;
    month: number;
    account_id: ID; // for GL
    page: number;
    per_page: number;
}>;

// generic pagination types already exist in src/types/http.ts
export type { Paginated, PaginatedMeta } from "./http";
