// src/pages/customers/CustomerDetail.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { changeCustomerStage, getCustomer, getCustomerHistory } from '../../api/customers';
import type { CustomerDetail as TDetail, CustomerTimelineEvent, CustomerStage } from '../../types/customers';
import CustomerStageBadge from '../../components/customers/CustomerStageBadge';
import CustomerTimeline from '../../components/customers/CustomerTimeline';
import { useAuth } from '../../store/auth';

export default function CustomerDetail() {
  const { id } = useParams();
  const cid = Number(id);
  const [detail, setDetail] = useState<TDetail | null>(null);
  const [timeline, setTimeline] = useState<CustomerTimelineEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tlLoading, setTlLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tlError, setTlError] = useState<string | null>(null);
  const { hasRole } = useAuth();
  const canChangeStage = hasRole('superadmin') || hasRole('admin_cabang');

  useEffect(() => {
    if (!Number.isFinite(cid)) {
      setError('Invalid customer id');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const d = await getCustomer(cid);
        if (!cancelled) setDetail(d);
      } catch {
        if (!cancelled) setError('Failed to load customer');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cid]);

  useEffect(() => {
    if (!Number.isFinite(cid)) {
      setTlError('Invalid customer id');
      setTlLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setTlLoading(true);
      setTlError(null);
      try {
        const h = await getCustomerHistory(cid);
        if (!cancelled) setTimeline(h);
      } catch {
        if (!cancelled) setTlError('Failed to load timeline');
      } finally {
        if (!cancelled) setTlLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cid]);

  async function onChangeStage(s: CustomerStage) {
    if (!detail) return;
    try {
      const updated = await changeCustomerStage(detail.customer.id, s);
      setDetail(d => (d ? { ...d, customer: updated } : d));
    } catch {
      // tempatkan toast global bila ada
    }
  }

  if (loading) {
    return (
      <div className="section p-4">
        <div className="card p-4">Loading…</div>
      </div>
    );
  }
  if (error || !detail) {
    return (
      <div className="section p-4">
        <div className="card p-4">
          <span className="badge badge-danger" style={{ verticalAlign: 'middle' }}>Error</span>
          <span style={{ marginLeft: 8 }}>{error ?? 'Not found'}</span>
        </div>
      </div>
    );
  }

  const c = detail.customer;

  // Toleransi nama/alamat beda field tanpa any
  const displayName =
    (c as unknown as { nama?: string }).nama ??
    (c as unknown as { name?: string }).name ??
    '—';

  const displayAddress =
    (c as unknown as { alamat?: string | null }).alamat ??
    (c as unknown as { address?: string | null }).address ??
    '—';

  return (
    <div className="section p-4">
      {/* Header detail */}
      <div className="card p-4">
        <div className="form-row form-row--2" style={{ alignItems: 'flex-start' }}>
          <div>
            <h1>{displayName}</h1>
            <div className="muted">
              {(c as unknown as { phone?: string | null }).phone ?? '—'} • {(c as unknown as { email?: string | null }).email ?? '—'}
            </div>
            <div className="muted">{displayAddress}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 8 }}>
              <CustomerStageBadge stage={c.stage} />
            </div>
            {canChangeStage ? (
              <select
                className="select"
                value={c.stage}
                onChange={(e) => onChangeStage(e.target.value as CustomerStage)}
              >
                <option value="LEAD">LEAD</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="CHURN">CHURN</option>
              </select>
            ) : null}
          </div>
        </div>
      </div>

      {/* Grid 2 kolom: Orders & Timeline */}
      <div className="form-row form-row--2" style={{ marginTop: 16 }}>
        {/* Recent Orders */}
        <section>
          <div className="card p-4">
            <h2>Recent Orders</h2>
            <div style={{ marginTop: 8 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Status</th>
                    <th>Grand Total</th>
                    <th>Ordered</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.orders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="muted" style={{ textAlign: 'center' }}>
                        No orders yet.
                      </td>
                    </tr>
                  ) : (
                    detail.orders.map((o) => (
                      <tr key={o.id}>
                        <td>{(o as unknown as { code?: string }).code ?? '-'}</td>
                        <td>{(o as unknown as { status?: string }).status ?? '-'}</td>
                        <td>{(o as unknown as { grand_total?: number | string }).grand_total ?? '-'}</td>
                        <td>
                          {(() => {
                            const dt =
                              (o as unknown as { ordered_at?: string }).ordered_at ??
                              (o as unknown as { created_at?: string }).created_at ??
                              null;
                            return dt ? new Date(dt).toLocaleString() : '-';
                          })()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section>
          <div className="card p-4">
            <h2>Timeline</h2>
            <div style={{ marginTop: 8 }}>
              <CustomerTimeline items={timeline} loading={tlLoading} error={tlError} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
