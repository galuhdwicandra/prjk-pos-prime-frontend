export type CustomerStage = 'LEAD' | 'ACTIVE' | 'CHURN';

export interface Customer {
    id: number;
    branch_id: number;
    nama: string;
    phone?: string | null;
    email?: string | null;
    alamat: string | null;
    catatan: string | null;
    stage: CustomerStage; // default 'ACTIVE' ketika auto-created
    last_order_at?: string | null;
    created_at: string;
    updated_at: string;
}

export type ID = number | string;
export interface CustomerQuery {
    q?: string;
    stage?: CustomerStage;
    from?: string; // ISO date
    to?: string;   // ISO date
    page?: number;
    per_page?: number;
    cabang_id?: ID
}

export interface LaravelPaginator<T> {
    current_page: number;
    data: T[];
    first_page_url: string | null;
    from: number | null;
    last_page: number;
    last_page_url: string | null;
    links?: Array<{ url: string | null; label: string; active: boolean }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

export interface CustomerUpsertPayload {
    nama: string;
    phone: string;
    email?: string | null;
    alamat?: string | null;
    catatan?: string | null;
}

export interface CustomerDetail {
    customer: Customer;
    orders: Array<{
        id: number;
        code: string;
        total: number;
        grand_total: string;
        status: string;
        ordered_at: string;
        paid_at?: string | null;
        created_at: string;
    }>;
}

export type CustomerTimelineEventType = 'ORDER' | 'PAYMENT' | 'DELIVERY' | 'NOTE';

export interface CustomerTimelineEvent {
    id: number;
    event_type: CustomerTimelineEventType;
    title?: string | null;
    note?: string | null;
    meta?: Record<string, unknown> | null;
    happened_at: string;
    created_at: string;
}
