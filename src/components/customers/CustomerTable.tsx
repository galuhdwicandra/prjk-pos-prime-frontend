// src/components/customers/CustomerTable.tsx
import { useEffect, useMemo, useState } from 'react';
import type { Customer, CustomerQuery, CustomerStage, LaravelPaginator } from '../../types/customers';
import { listCustomers } from '../../api/customers';
import CustomerStageBadge from './CustomerStageBadge';

interface Props {
  onRowClick?: (c: Customer) => void;
  canCreate?: boolean;
  onCreate?: () => void;
}

// ✅ Selaras backend
const stages: CustomerStage[] = ['LEAD', 'ACTIVE', 'CHURN'];

// ✅ Helper tanpa `any`: dukung backend yang kadang kirim `nama` atau `name`
type CustomerRow = Customer & { nama?: string; name?: string };
const getDisplayName = (c: CustomerRow) => c.nama ?? c.name ?? '';

export default function CustomerTable({ onRowClick, canCreate = false, onCreate }: Props) {
  const [query, setQuery] = useState<CustomerQuery>({ page: 1, per_page: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<LaravelPaginator<Customer> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listCustomers(query);
        if (!cancelled) setRows(data);
      } catch {
        if (!cancelled) setError('Failed to load customers');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const empty = useMemo(() => (rows?.data.length ?? 0) === 0, [rows]);
  const page = rows?.current_page ?? 1;
  const lastPage = rows?.last_page ?? 1;

  return (
    <div className="section">
      {/* Filter Toolbar */}
      <div className="card">
        <div className="form-row form-row--3">
          <div>
            <label className="form-label">Search (name/phone/email)</label>
            <input
              className="input"
              placeholder="e.g. Andi / 08xx / mail@"
              value={query.q ?? ''}
              onChange={(ev) => setQuery((q) => ({ ...q, q: ev.target.value, page: 1 }))}
            />
          </div>

          <div>
            <label className="form-label">Stage</label>
            <select
              className="select"
              value={query.stage ?? ''}
              onChange={(ev) =>
                setQuery((q) => ({
                  ...q,
                  stage: (ev.target.value as CustomerStage) || undefined,
                  page: 1,
                }))
              }
            >
              <option value="">All</option>
              {stages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div>
              <label className="form-label">From</label>
              <input
                type="date"
                className="input"
                value={query.from ?? ''}
                onChange={(ev) => setQuery((q) => ({ ...q, from: ev.target.value || undefined, page: 1 }))}
              />
            </div>
            <div>
              <label className="form-label">To</label>
              <input
                type="date"
                className="input"
                value={query.to ?? ''}
                onChange={(ev) => setQuery((q) => ({ ...q, to: ev.target.value || undefined, page: 1 }))}
              />
            </div>
          </div>
        </div>

        {canCreate ? (
          <div className="actions-right">
            <button className="button button-primary" onClick={() => onCreate?.()} disabled={loading}>
              New Customer
            </button>
          </div>
        ) : null}
      </div>

      {/* Table */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th className="text-left">Name</th>
              <th className="text-left">Phone</th>
              <th className="text-left">Email</th>
              <th className="text-left">Stage</th>
              <th className="text-left">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="text-center muted" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="text-center danger" colSpan={5}>
                  {error}
                </td>
              </tr>
            ) : rows ? (
              rows.data.map((c) => {
                const row = c as CustomerRow;
                return (
                  <tr key={c.id} onClick={() => onRowClick?.(c)}>
                    <td className="font-medium">{getDisplayName(row)}</td>
                    <td>{row.phone}</td>
                    <td>{row.email ?? '-'}</td>
                    <td>
                      <CustomerStageBadge stage={row.stage} />
                    </td>
                    <td>{row.last_order_at ? new Date(row.last_order_at).toLocaleString() : '-'}</td>
                  </tr>
                );
              })
            ) : null}

            {rows && empty && !loading && !error ? (
              <tr>
                <td className="text-center muted" colSpan={5}>
                  No customers found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="card">
        <div className="toolbar">
          <div className="muted text-xs">Page {page} / {lastPage}</div>
          <div className="toolbar-actions">
            <button
              className="button button-outline"
              disabled={!rows || page <= 1 || loading}
              onClick={() => setQuery((q) => ({ ...q, page: Math.max(1, (q.page ?? 1) - 1) }))}
            >
              Prev
            </button>
            <button
              className="button button-outline"
              disabled={!rows || page >= lastPage || loading}
              onClick={() => setQuery((q) => ({ ...q, page: Math.min(lastPage, (q.page ?? 1) + 1) }))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
