// src/components/fees/FeeDetailDialog.tsx
import type { FeeEntry } from "../../types/pos";

type Props = {
  open: boolean;
  onClose: () => void;
  entry?: FeeEntry | null;
};

export default function FeeDetailDialog({ open, onClose, entry }: Props): React.ReactElement | null {
  if (!open || !entry) return null;

  // Backdrop inline-style agar tidak perlu kelas baru di index.css
  const backdropStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  };

  // Container pakai .card dari index.css
  const containerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 720,
  };

  return (
    <div style={backdropStyle} role="dialog" aria-modal="true" aria-labelledby="fee-detail-title">
      <div className="card" style={containerStyle}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <h3 id="fee-detail-title">Detail Fee</h3>
          <button onClick={onClose} className="button button-ghost" aria-label="Tutup dialog">
            ✕
          </button>
        </div>

        {/* Konten: gunakan .table untuk layout label–value */}
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <tbody>
              <tr>
                <th style={{ width: "40%" }}>Tanggal</th>
                <td>{entry.period_date}</td>
              </tr>
              <tr>
                <th>Cabang</th>
                <td>{entry.cabang_id}</td>
              </tr>
              <tr>
                <th>Jenis</th>
                <td>{entry.fee?.kind ?? "-"}</td>
              </tr>
              <tr>
                <th>Referensi</th>
                <td>
                  {entry.ref_type}#{entry.ref_id}
                </td>
              </tr>
              <tr>
                <th>Pemilik</th>
                <td>{entry.owner_user_id ?? "-"}</td>
              </tr>
              <tr>
                <th>Base</th>
                <td>Rp {Number(entry.base_amount).toLocaleString()}</td>
              </tr>
              <tr>
                <th>Fee</th>
                <td><strong>Rp {Number(entry.fee_amount).toLocaleString()}</strong></td>
              </tr>
              <tr>
                <th>Status Bayar</th>
                <td>{entry.pay_status}</td>
              </tr>
              {entry.paid_at ? (
                <tr>
                  <th>Dibayar</th>
                  <td>
                    Rp {Number(entry.paid_amount).toLocaleString()} @ {entry.paid_at}
                  </td>
                </tr>
              ) : null}
              {entry.notes ? (
                <tr>
                  <th>Catatan</th>
                  <td>{entry.notes}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={onClose} className="button button-primary">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
