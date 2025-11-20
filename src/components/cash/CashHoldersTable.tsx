// src/components/cash/CashHoldersTable.tsx
import React, { useEffect, useMemo, useState } from "react";
import { listCashHolders } from "../../api/cash";
import type { CashHolder, CashHolderQuery } from "../../types/cash";

type Props = {
  branchId?: number;
  onPickSubmit?: (holder: CashHolder) => void; // prefill "from" in submit dialog
};

export default function CashHoldersTable({ branchId, onPickSubmit }: Props): React.ReactElement {
  const [query, setQuery] = useState<CashHolderQuery>({ page: 1, per_page: 10, branch_id: branchId });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CashHolder[]>([]);
  const [meta, setMeta] = useState<{ current_page: number; per_page: number; total: number; last_page: number }>({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    listCashHolders(query)
      .then((res) => {
        if (!alive) return;
        setData(res.data);
        setMeta(res.meta);
      })
      .catch((e: unknown) => alive && setError((e as { message?: string }).message ?? "Gagal memuat holder kas."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [query]);

  const rows = useMemo(() => data, [data]);

  return (
    <div className="card">
      {/* Toolbar pencarian */}
      <div className="toolbar">
        <div className="toolbar-actions" style={{ width: "100%" }}>
          <input
            value={query.q ?? ""}
            onChange={(e) => setQuery((s) => ({ ...s, q: e.target.value, page: 1 }))}
            placeholder="Cari holder…"
            className="input"
            aria-label="Cari holder"
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* State: loading / error / empty / table */}
      {loading ? (
        <div className="card-section">Loading…</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : rows.length === 0 ? (
        <div className="card-section">Tidak ada data.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Nama</th>
              <th style={{ textAlign: "right" }}>Saldo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.id}>
                <td>{h.name}</td>
                <td style={{ textAlign: "right" }}>
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(h.balance)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {onPickSubmit ? (
                    <button type="button" onClick={() => onPickSubmit(h)} className="button button-outline">
                      Submit Setoran…
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="toolbar">
        <div className="toolbar-title">
          Hal. {meta.current_page} / {meta.last_page}
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            disabled={meta.current_page <= 1}
            onClick={() => setQuery((s) => ({ ...s, page: (s.page ?? 1) - 1 }))}
            className="button"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={meta.current_page >= meta.last_page}
            onClick={() => setQuery((s) => ({ ...s, page: (s.page ?? 1) + 1 }))}
            className="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
