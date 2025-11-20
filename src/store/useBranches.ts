import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../api/branches";
import type {
  Branch,
  BranchCreatePayload,
  BranchDetailResponse,
  BranchListResponse,
  BranchQuery,
  BranchUpdatePayload,
  PaginatedMeta,
} from "../types/branch";

function shallowEqual(a?: Record<string, unknown>, b?: Record<string, unknown>) {
  if (a === b) return true;
  if (!a || !b) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

type ListState = {
  items: Branch[];
  meta: PaginatedMeta | null;
  loading: boolean;
  error: string | null;
  query: BranchQuery;
};

export function useBranches(initial?: BranchQuery) {
  const [state, setState] = useState<ListState>({
    items: [],
    meta: null,
    loading: false,
    error: null,
    query: { page: 1, per_page: 10, ...initial },
  });

  // simpan query terkini sebagai referensi stabil
  const queryRef = useRef<BranchQuery>(state.query);
  // sinkronkan ref saat state.query benar-benar berubah
  useEffect(() => {
    queryRef.current = state.query;
  }, [state.query]);

  const fetchList = useCallback(async (q?: BranchQuery) => {
    const nextQuery: BranchQuery = { ...queryRef.current, ...q };
    const queryChanged = !shallowEqual(queryRef.current as Record<string, unknown>, nextQuery as Record<string, unknown>);

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res: BranchListResponse = await listBranches(nextQuery);
      setState((s) => ({
        ...s,
        loading: false,
        items: res.data,
        meta: res.meta,
        // hanya update query jika berubah (mencegah update depth loop)
        query: queryChanged ? nextQuery : s.query,
      }));
      if (queryChanged) {
        queryRef.current = nextQuery;
      }
    } catch {
      setState((s) => ({ ...s, loading: false, error: "Gagal memuat cabang" }));
    }
  }, []);

  const refresh = useCallback(() => fetchList(), [fetchList]);

  const find = useCallback(async (id: number): Promise<Branch | null> => {
    try {
      const res: BranchDetailResponse = await getBranch(id);
      return res.data;
    } catch {
      return null;
    }
  }, []);

  const create = useCallback(async (payload: BranchCreatePayload): Promise<boolean> => {
    try {
      await createBranch(payload);
      await refresh();
      return true;
    } catch {
      return false;
    }
  }, [refresh]);

  const update = useCallback(async (id: number, payload: BranchUpdatePayload): Promise<boolean> => {
    try {
      await updateBranch(id, payload);
      await refresh();
      return true;
    } catch {
      return false;
    }
  }, [refresh]);

  const remove = useCallback(async (id: number): Promise<boolean> => {
    try {
      await deleteBranch(id);
      await refresh();
      return true;
    } catch {
      return false;
    }
  }, [refresh]);

  useEffect(() => {
    // initial load, memakai fetchList yang stabil
    void fetchList();
  }, [fetchList]);

  const pagination = useMemo(() => {
    const m = state.meta;
    return {
      page: state.query.page ?? 1,
      per_page: state.query.per_page ?? 10,
      total: m?.total ?? 0,
      last_page: m?.last_page ?? 1,
      setPage: (page: number) => void fetchList({ page }),
      setPerPage: (per_page: number) => void fetchList({ per_page, page: 1 }),
    };
  }, [state.meta, state.query.page, state.query.per_page, fetchList]);

  return { ...state, fetchList, refresh, find, create, update, remove, pagination };
}
