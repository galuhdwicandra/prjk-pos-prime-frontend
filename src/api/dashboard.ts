// src/api/dashboard.ts
import { api } from './client';
import type {
    KPIs,
    Chart7DayPoint,
    TopProduct,
    LowStockRow,
    QuickAction,
    DashboardQuery,
} from '../types/dashboard';

function unwrap<T>(payload: unknown): T {
    const j = payload as Record<string, unknown>;
    if (j && typeof j === 'object' && 'data' in j) {
        return (j.data ?? null) as T;
    }
    return j as unknown as T;
}

/** GET /dashboard/kpis?branch_id=&from=&to= */
export async function getKPIs(q: DashboardQuery): Promise<KPIs> {
    const { data } = await api.get('/dashboard/kpis', {
        params: {
            cabang_id: q.cabang_id ?? undefined,
            from: q.from,
            to: q.to,
        },
    });
    return unwrap<KPIs>(data);
}

/** GET /dashboard/chart7d?branch_id= */
export async function getChart7d(q: DashboardQuery): Promise<Chart7DayPoint[]> {
    const { data } = await api.get('/dashboard/chart7d', {
        params: {
            cabang_id: q.cabang_id ?? undefined,
        },
    });
    return unwrap<Chart7DayPoint[]>(data);
}

/** GET /dashboard/top-products?branch_id=&limit= */
export async function getTopProducts(q: DashboardQuery): Promise<TopProduct[]> {
    const { data } = await api.get('/dashboard/top-products', {
        params: {
            cabang_id: q.cabang_id ?? undefined,
            limit: q.limit ?? 5,
        },
    });
    return unwrap<TopProduct[]>(data);
}

/** GET /dashboard/low-stock?branch_id=&threshold= */
export async function getLowStock(q: DashboardQuery): Promise<LowStockRow[]> {
    const { data } = await api.get('/dashboard/low-stock', {
        params: {
            cabang_id: q.cabang_id ?? undefined,
            threshold: q.threshold,
        },
    });
    return unwrap<LowStockRow[]>(data);
}

/** GET /dashboard/quick-actions?branch_id= */
export async function getQuickActions(q: DashboardQuery): Promise<QuickAction[]> {
    const { data } = await api.get('/dashboard/quick-actions', {
        params: {
            cabang_id: q.cabang_id ?? undefined,
        },
    });
    return unwrap<QuickAction[]>(data);
}
