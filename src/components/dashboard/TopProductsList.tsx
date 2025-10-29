// src/components/dashboard/TopProductsList.tsx
import type { TopProduct } from '../../types/dashboard';

type Props = {
  data: TopProduct[] | null;
  loading: boolean;
  error: string | null;
  onViewVariant?: (variantId: number) => void;
};

function fmtMoney(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function TopProductsList({ data, loading, error, onViewVariant }: Props): React.ReactElement {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Top Products</div>

      {/* Loading placeholder */}
      {loading && (
        <div
          aria-hidden
          style={{
            height: 96,
            borderRadius: 8,
            background: 'rgba(0,0,0,.05)',
          }}
        />
      )}

      {/* Error */}
      {error && (
        <div style={{ color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && (!data || data.length === 0) && (
        <div style={{ fontSize: 13, opacity: 0.7 }}>No top products.</div>
      )}

      {/* List */}
      {!loading && !error && data && data.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {data.map((r, idx) => (
            <li
              key={`${r.variant_id}-${r.name}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderTop: idx === 0 ? 'none' : '1px solid rgba(0,0,0,.06)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.name}
                </div>
                <div style={{ fontSize: 12, opacity: 0.65 }}>Qty {r.qty}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{fmtMoney(r.revenue)}</div>

                {onViewVariant && (
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => onViewVariant(r.variant_id)}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                    aria-label={`Detail ${r.name}`}
                    title="Detail"
                  >
                    Detail
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
