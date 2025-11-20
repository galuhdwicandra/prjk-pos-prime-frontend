import { api } from './client';
import type {
  Customer,
  CustomerQuery,
  LaravelPaginator,
  CustomerUpsertPayload,
  CustomerDetail,
  CustomerTimelineEvent,
  CustomerStage,
} from '../types/customers';

/** ---------------------------
 *  Backend-specific types (untuk normalisasi READ)
 *  --------------------------- */
type BackendCustomer = Omit<Customer, 'branch_id'> & {
  // backend kirim cabang_id (bisa null)
  cabang_id: number | null;
};

type BackendCustomerDetail = Omit<CustomerDetail, 'customer'> & {
  customer: BackendCustomer;
};

/** ---------------------------
 *  Helpers: normalize & paginator
 *  --------------------------- */
function normalizeCustomer(c: BackendCustomer): Customer {
  const { cabang_id, ...rest } = c;
  // Customer.branch_id bertipe number (non-null) di types kamu.
  // Paksa ke number (fallback 0) agar lolos tipe.
  const branchId: number = typeof cabang_id === 'number' ? cabang_id : 0;
  return { ...(rest as Omit<Customer, 'branch_id'>), branch_id: branchId };
}

function mapPaginator<TIn, TOut>(
  p: LaravelPaginator<TIn>,
  mapper: (x: TIn) => TOut
): LaravelPaginator<TOut> {
  return { ...p, data: p.data.map(mapper) };
}

/** ---------------------------
 *  Helper WRITE (fleksibel branch_id → cabang_id)
 *  - Jika payload punya branch_id, map ke cabang_id.
 *  - Jika tidak, biarkan (berarti payload sudah cabang_id).
 *  --------------------------- */
type MaybeBranch = { branch_id?: number };
type WithCabang<T> = Omit<T, 'branch_id'> & { cabang_id?: number };

function toBackendPayload<T extends object>(payload: T): WithCabang<T> {
  // gunakan 'in' untuk narrowing tanpa any
  if ('branch_id' in (payload as MaybeBranch)) {
    const p = payload as T & Required<MaybeBranch>;
    const { branch_id, ...rest } = p;
    const out: WithCabang<T> = { ...(rest as Omit<T, 'branch_id'>), cabang_id: branch_id };
    return out;
  }
  // payload sudah bentuk backend (punya cabang_id atau tidak membutuhkan field itu)
  return payload as WithCabang<T>;
}

/** ---------------------------
 *  API functions (READ dinormalisasi, WRITE fleksibel)
 *  --------------------------- */
export async function listCustomers(
  params: CustomerQuery
): Promise<LaravelPaginator<Customer>> {
  const { data } = await api.get<LaravelPaginator<BackendCustomer>>('/customers', { params });
  return mapPaginator<BackendCustomer, Customer>(data, normalizeCustomer);
}

export async function getCustomer(id: number): Promise<CustomerDetail> {
  const { data } = await api.get<BackendCustomerDetail>(`/customers/${id}`);
  const normalized: CustomerDetail = {
    ...data,
    customer: normalizeCustomer(data.customer),
  };
  return normalized;
}

export async function getCustomerHistory(id: number): Promise<CustomerTimelineEvent[]> {
  const { data } = await api.get<{ timelines?: CustomerTimelineEvent[] }>(`/customers/${id}/history`);
  return data.timelines ?? [];
}

export async function createCustomer(payload: CustomerUpsertPayload): Promise<Customer> {
  const body = toBackendPayload<CustomerUpsertPayload>(payload);
  const { data } = await api.post<BackendCustomer>(`/customers`, body);
  return normalizeCustomer(data);
}

export async function updateCustomer(
  id: number,
  payload: Partial<CustomerUpsertPayload>
): Promise<Customer> {
  const body = toBackendPayload<Partial<CustomerUpsertPayload>>(payload);
  const { data } = await api.put<BackendCustomer>(`/customers/${id}`, body);
  return normalizeCustomer(data);
}

export async function deleteCustomer(id: number): Promise<void> {
  await api.delete(`/customers/${id}`);
}

export async function changeCustomerStage(
  id: number,
  stage: CustomerStage
): Promise<Customer> {
  const { data } = await api.post<BackendCustomer>(`/customers/${id}/stage`, { stage });
  return normalizeCustomer(data);
}

// alias opsional (kalau masih dipakai di komponen)
export async function setCustomerStage(
  id: number,
  stage: CustomerStage
): Promise<Customer> {
  const { data } = await api.post<BackendCustomer>(`/customers/${id}/stage`, { stage });
  return normalizeCustomer(data);
}
