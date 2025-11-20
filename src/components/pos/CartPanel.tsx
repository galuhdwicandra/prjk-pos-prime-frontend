// src/components/pos/CartPanel.tsx
import React from 'react';
import { useCart } from '../../store/cart';
import { rupiah } from '../../utils/rupiah';

export default function CartPanel(): React.ReactElement {
  const { items, setQty, remove, quote, quoting, error } = useCart();

  return (
    <div className="card">
      <div className="card-title">Keranjang</div>

      {items.length === 0 ? (
        <div className="empty-state">Belum ada item</div>
      ) : (
        <div className="table-responsive">
          <table className="table" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col/>
              <col style={{ width: 88 }}/>
              <col style={{ width: 120 }}/>
              <col style={{ width: 88 }}/>
            </colgroup>
            <thead>
              <tr>
                <th>Item</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Harga</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.variant_id}>
                  <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.name ?? `Var#${row.variant_id}`}
                  </td>

                  <td className="text-center">
                    <input
                      type="number"
                      min={1}
                      value={row.qty}
                      className="input text-right"
                      style={{ width: 68 }}
                      onChange={(e) => setQty(row.variant_id, Math.max(1, Number(e.target.value)))}
                      aria-label={`Qty ${row.name ?? `Var#${row.variant_id}`}`}
                    />
                  </td>

                  <td className="text-right mono" style={{ whiteSpace: 'nowrap' }}>
                    {row.price_hint ? rupiah(row.price_hint) : '-'}
                  </td>

                  <td className="text-right">
                    <button
                      className="button button-ghost"
                      style={{ padding: '4px 8px' }}
                      onClick={() => remove(row.variant_id)}
                      aria-label={`Hapus ${row.name ?? `Var#${row.variant_id}`}`}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="divider" />

      <div>
        {quoting ? (
          <div className="muted">Hitung ulang…</div>
        ) : quote ? (
          <div aria-live="polite">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Subtotal</span>
              <span className="mono">{rupiah(quote.totals.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Diskon</span>
              <span className="mono">{rupiah(quote.totals.discount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>PPN</span>
              <span className="mono">{rupiah(quote.totals.tax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
              <span>Total</span>
              <span className="mono">{rupiah(quote.totals.grand_total)}</span>
            </div>
          </div>
        ) : (
          <div className="muted">Tambahkan item untuk melihat total.</div>
        )}

        {error && <div className="alert alert-danger" style={{ marginTop: 8 }}>{error}</div>}
      </div>
    </div>
  );
}
