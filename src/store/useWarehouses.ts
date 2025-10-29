import { useCallback, useEffect, useMemo, useState } from "react";
import {
    listWarehouses,
    getWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
} from "../api/warehouses";
import type {
    Warehouse,
    WarehouseCreatePayload,
    WarehouseDetailResponse,
    WarehouseListResponse,
    WarehouseQuery,
    WarehouseUpdatePayload,
} from "../types/warehouse";

type ListState = {
    items: Warehouse[];
    loading: boolean;
    error: string | null;
    query: WarehouseQuery;
    total: number;
    last_page: number;
    current_page: number;
    per_page: number;
};

export function useWarehouses(initial?: WarehouseQuery) {
    const [state, setState] = useState<ListState>({
        items: [],
        loading: false,
        error: null,
        query: { page: 1, per_page: 10, ...initial },
        total: 0,
        last_page: 1,
        current_page: 1,
        per_page: 10,
    });

    const fetchList = useCallback(async (q?: WarehouseQuery) => {
        // jangan ubah query kalau q tidak diberikan => hindari perubahan fungsi fetchList (deps)
        setState((s) => ({
            ...s,
            loading: true,
            error: null,
            query: q ? { ...s.query, ...q } : s.query,
        }));

        try {
            const res: WarehouseListResponse = await listWarehouses({ ...state.query, ...q });
            setState((s) => ({
                ...s,
                loading: false,
                items: res.data,
                total: Number(res.meta.total ?? 0),
                last_page: Number(res.meta.last_page ?? 1),
                current_page: Number(res.meta.current_page ?? 1),
                per_page: Number(res.meta.per_page ?? s.per_page), // <- paksa number
            }));
        } catch {
            setState((s) => ({ ...s, loading: false, error: "Gagal memuat gudang" }));
        }
    }, [state.query]);

    const refresh = useCallback(() => fetchList(), [fetchList]);

    const find = useCallback(async (id: number): Promise<Warehouse | null> => {
        try {
            const res: WarehouseDetailResponse = await getWarehouse(id);
            return res.data;
        } catch {
            return null;
        }
    }, []);

    const create = useCallback(async (payload: WarehouseCreatePayload): Promise<boolean> => {
        try {
            await createWarehouse(payload);
            await refresh();
            return true;
        } catch {
            return false;
        }
    }, [refresh]);

    const update = useCallback(async (id: number, payload: WarehouseUpdatePayload): Promise<boolean> => {
        try {
            await updateWarehouse(id, payload);
            await refresh();
            return true;
        } catch {
            return false;
        }
    }, [refresh]);

    const remove = useCallback(async (id: number): Promise<boolean> => {
        try {
            await deleteWarehouse(id);
            await refresh();
            return true;
        } catch {
            return false;
        }
    }, [refresh]);

    useEffect(() => {
        void fetchList();
    }, [fetchList]);

    const pagination = useMemo(() => ({
        page: state.current_page,
        per_page: state.per_page,
        total: state.total,
        last_page: state.last_page,
        setPage: (page: number) => fetchList({ page }),
        setPerPage: (per_page: number) => fetchList({ per_page, page: 1 }),
    }), [state.current_page, state.per_page, state.total, state.last_page, fetchList]);

    return { ...state, fetchList, refresh, find, create, update, remove, pagination };
}
