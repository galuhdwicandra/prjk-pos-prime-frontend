// src/components/fees/FeeTable.tsx
import { useMemo } from "react";
import type { FeeEntry } from "../../types/pos";

type Props = {
  rows: FeeEntry[];
  loading?: boolean;
  error?: string | null;
  onSelect?: (row: FeeEntry) => void;
  onExport?: () => void;
};

export default function FeeTable({ rows, loading, error, onSelect, onExport }: Props): React.ReactElement {
  const empty = !loading && rows.length === 0 && !error;
  const hasError = Boolean(error);

  const total = useMemo(() => rows.reduce((acc, r) => acc + Number(r.fee_amount || 0), 0), [rows]);

  return (
    <div className="card">
      {/* Header ringkas di atas tabel */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <div className="muted">
          Total {rows.length} baris • Jumlah Fee: <b>Rp {total.toLocaleString("id-ID")}</b>
        </div>
        <div>
          <button className="button button-outline" onClick={onExport} disabled={loading}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={{ width: 120 }}>Tanggal</th>
              <th>Jenis</th>
              <th>Ref</th>
              <th style={{ textAlign: "right" }}>Base</th>
              <th style={{ textAlign: "right" }}>Fee</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "24px 0" }}>Memuat…</td>
              </tr>
            ) : hasError ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "24px 0" }}>
                  <span className="badge badge-danger">{error}</span>
                </td>
              </tr>
            ) : empty ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "24px 0" }}>Tidak ada data</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} onClick={() => onSelect?.(r)} style={{ cursor: "pointer" }}>
                  <td>{r.period_date}</td>
                  <td>{r.fee?.kind ?? "-"}</td>
                  <td>{r.ref_type}#{r.ref_id}</td>
                  <td style={{ textAlign: "right" }}>
                    Rp {Number(r.base_amount).toLocaleString("id-ID")}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    Rp {Number(r.fee_amount).toLocaleString("id-ID")}
                  </td>
                  <td>
                    <span
                      className={
                        "badge " +
                        (r.pay_status === "PAID"
                          ? "badge-success"
                          : r.pay_status === "PARTIAL"
                          ? "badge-warning"
                          : "badge-danger")
                      }
                    >
                      {r.pay_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
