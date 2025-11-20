// src/components/pos/ReceiptPreview.tsx
import React, { useEffect, useState } from 'react';
import { getReceiptHtml } from '../../api/pos';

type Props = { orderId: number; phone?: string | null };

export default function ReceiptPreview({ orderId, phone }: Props): React.ReactElement {
  const [html, setHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // HTML thermal 58/80mm
        setHtml(await getReceiptHtml(orderId));
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [orderId]);

  function doPrint() {
    if (!html) return;
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  function waLink(): string | null {
    if (!phone) return null;
    const text = `Order #${orderId}\nTerima kasih. Struk pembelian terlampir.`;
    return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="card">
      <div className="modal-header">
        <h3 className="modal-title">Struk</h3>
        <div className="btn-group">
          <button className="button button-outline" onClick={doPrint} disabled={!html}>
            Print
          </button>
          {waLink() && (
            <a
              className="button"
              href={waLink()!}
              target="_blank"
              rel="noreferrer"
            >
              Kirim WA
            </a>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {!error && (
        <div className="card soft">
          {/* gunakan container card untuk border & shadow;
              iframe dibiarkan clean agar fokus ke konten struk */}
          <iframe
            title="Receipt"
            srcDoc={html}
            style={{ width: '100%', height: '24rem', border: 'none' }}
          />
        </div>
      )}
    </div>
  );
}
