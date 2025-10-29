// src/components/dashboard/KPIStatCards.tsx
import { useMemo } from 'react';
import type { KPIs } from '../../types/dashboard';

type Props = {
  data: KPIs | null;
  loading: boolean;
  error: string | null;
};

function fmtMoney(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function KPIStatCards({ data, loading, error }: Props): React.ReactElement {
  const items = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'Orders', value: data.orders_total as number | string },
      { label: 'Paid Orders', value: data.orders_paid as number | string },
      { label: 'Revenue', value: fmtMoney(data.revenue) as string },
      { label: 'Avg Ticket', value: fmtMoney(data.avg_ticket) as string },
    ];
  }, [data]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        alignItems: 'stretch',
      }}
    >
      {loading &&
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ height: 80, background: 'rgba(0,0,0,.04)' }} />
        ))}

      {error && (
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-danger">Error</span>
            <span style={{ fontSize: 12 }}>{error}</span>
          </div>
        </div>
      )}

      {!loading &&
        !error &&
        items.map((it) => (
          <div key={it.label} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{it.label}</div>
            <div style={{ marginTop: 4, fontSize: 20, fontWeight: 600 }}>{it.value}</div>
          </div>
        ))}

      {!loading && !error && data && (
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className={`badge ${data.validation.is_consistent ? 'badge-success' : 'badge-warning'}`}
            title={`Paid Sum: ${fmtMoney(data.validation.paid_amount_sum)} | Diff: ${fmtMoney(
              data.validation.orders_vs_payments_diff
            )}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            {data.validation.is_consistent ? 'Payments consistent' : 'Check payments mismatch'}
          </span>
          <span style={{ fontSize: 12, opacity: 0.75 }}>{data.paid_rate_pct}% paid</span>
        </div>
      )}
    </div>
  );
}
