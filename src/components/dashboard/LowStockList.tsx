// src/components/dashboard/LowStockList.tsx
import type { LowStockRow } from '../../types/dashboard';

type Props = {
  data: LowStockRow[] | null;
  loading: boolean;
  error: string | null;
  onOpenStock?: (variantId: number) => void;
};

export default function LowStockList({ data, loading, error, onOpenStock }: Props) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Low Stock</div>

      {loading && (
        <div
          aria-busy="true"
          style={{
            height: 96,
            borderRadius: 8,
            background: 'rgba(0,0,0,.05)',
          }}
        />
      )}

      {error && (
        <div style={{ marginTop: 6 }}>
          <span className="badge badge-danger" title={error}>
            {error}
          </span>
        </div>
      )}

      {!loading && !error && (!data || data.length === 0) && (
        <div style={{ fontSize: 13, opacity: 0.7 }}>All good — nothing is below threshold.</div>
      )}

      {!loading && !error && data && data.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {data.map((r, idx) => (
            <li
              key={`${r.variant_id}-${r.gudang_id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderTop: idx === 0 ? 'none' : '1px solid rgba(0,0,0,.06)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.name}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {r.sku} — On hand {r.qty_on_hand} / Min {r.min_stock}
                </div>
              </div>

              {onOpenStock && (
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => onOpenStock(r.variant_id)}
                  style={{ padding: '4px 8px', fontSize: 12 }}
                  aria-label={`Open stock for ${r.sku}`}
                >
                  Stock
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
