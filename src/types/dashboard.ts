// src/types/dashboard.ts
export type ID = number | string;

export type KPIValidation = {
    paid_amount_sum: number;
    orders_vs_payments_diff: number;
    is_consistent: boolean;
};

export type KPIs = {
    orders_total: number;
    orders_paid: number;
    revenue: number;
    avg_ticket: number;
    paid_rate_pct: number;
    validation: KPIValidation;
};

export type Chart7DayPoint = {
    date: string;   // YYYY-MM-DD
    orders: number;
    revenue: number;
};

export type TopProduct = {
    variant_id: number;
    name: string;
    qty: number;
    revenue: number;
};

export type LowStockRow = {
    gudang_id: number;
    variant_id: number;
    sku: string;
    name: string;
    qty_on_hand: number;
    min_stock: number;
};

export type QuickAction =
    | {
        type: 'LOW_STOCK';
        label: string;
        payload: {
            count: number;
            first_sku: string | null;
        };
    }
    | {
        type: 'PAYMENT_CHECK';
        label: string;
    };

export type DashboardQuery = {
    cabang_id?: ID | null;
    from?: string; // ISO date/time accepted by backend (CommonQuery)
    to?: string;
    limit?: number;
    threshold?: number;
};
