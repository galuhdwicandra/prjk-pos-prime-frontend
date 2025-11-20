// src/pages/cash/CashHistory.tsx
import React, { useEffect, useMemo, useState } from "react";
import { approveCashMove, listCashMoves, rejectCashMove, listCashHolders } from "../../api/cash";
import type { CashMove, CashMoveQuery, CashHolder } from "../../types/cash";
import { useAuth } from "../../store/auth";

export default function CashHistory(): React.ReactElement {
  const { hasRole } = useAuth();
  const canApprove = hasRole("superadmin") || hasRole("admin_cabang");

  const [q, setQ] = useState<CashMoveQuery>({ page: 1, per_page: 10 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<CashMove[]>([]);
  const [meta, setMeta] = useState<{ current_page: number; per_page: number; total: number; last_page: number }>({
    current_page: 1, per_page: 10, total: 0, last_page: 1
  });
  const [holders, setHolders] = useState<CashHolder[]>([]);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const holderMap = useMemo(() => {
    const map: Record<number, CashHolder> = {};
    holders.forEach((h) => { map[Number(h.id)] = h; });
    return map;
  }, [holders]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([listCashMoves(q), listCashHolders({ per_page: 100 })])
      .then(([moves, holdersRes]) => {
        if (!alive) return;
        setRows(moves.data);
        setMeta(moves.meta);
        setHolders(holdersRes.data);
      })
      .catch((e: unknown) => alive && setError((e as { message?: string }).message ?? "Gagal memuat riwayat setoran."))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [q]);

  const data = useMemo(() => rows, [rows]);

  function hasSufficientBalance(m: CashMove): boolean {
    const from = holderMap[Number(m.from_holder_id)];
    if (!from || typeof from.balance !== "number") return true; // biar backend yang validasi
    return from.balance >= (m.amount ?? 0);
  }

  return (
    <div className="page">
      <h1 className="page-title">Riwayat Setoran Tunai</h1>

      {/* Filter Bar */}
      <div className="toolbar">
        <div className="toolbar-body">
          <input
            value={q.q ?? ""}
            onChange={(e) => setQ((s) => ({ ...s, q: e.target.value, page: 1 }))}
            className="input"
            placeholder="Cari catatan / holder…"
          />
          <select
            value={q.status ?? ""}
            onChange={(e) =>
              setQ((s) => ({
                ...s,
                status: e.target.value ? (e.target.value as CashMove["status"]) : undefined,
                page: 1
              }))
            }
            className="select"
          >
            <option value="">Semua status</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* State: Loading / Error / Empty */}
      {loading ? (
        <div className="card"><div>Loading…</div></div>
      ) : error ? (
        <div className="card"><div className="alert alert-danger">{error}</div></div>
      ) : data.length === 0 ? (
        <div className="card"><div className="muted">Belum ada data.</div></div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Dari</th>
                <th>Ke</th>
                <th>Saldo Dari</th>
                <th>Jumlah</th>
                <th>Status</th>
                <th className="ta-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m) => {
                const saldoFrom = holderMap[Number(m.from_holder_id)]?.balance ?? 0;
                const statusClass =
                  m.status === "APPROVED" ? "badge badge-success" :
                  m.status === "REJECTED" ? "badge badge-danger" :
                  "badge badge-warning";

                return (
                  <tr key={m.id}>
                    <td><code>{m.submitted_at}</code></td>
                    <td>{m.from_holder?.name ?? m.from_holder_id}</td>
                    <td>{m.to_holder?.name ?? m.to_holder_id}</td>
                    <td data-align="right">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
                        .format(saldoFrom)}
                    </td>
                    <td data-align="right">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
                        .format(m.amount)}
                    </td>
                    <td>
                      <span className={statusClass}>{m.status}</span>
                    </td>
                    <td className="ta-right">
                      {canApprove && m.status === "SUBMITTED" ? (
                        <div className="actions">
                          <button
                            type="button"
                            className="button button-primary"
                            disabled={approvingId === m.id}
                            onClick={async (ev) => {
                              ev.stopPropagation();
                              if (approvingId === m.id) return;

                              if (!hasSufficientBalance(m)) {
                                const ok = window.confirm(
                                  "Saldo holder asal kurang dari jumlah move.\nTetap kirim approve dan biarkan server yang memvalidasi?"
                                );
                                if (!ok) return;
                              }

                              setApprovingId(m.id);
                              try {
                                await approveCashMove(m.id);
                                setRows((arr) =>
                                  arr.map((x) =>
                                    x.id === m.id ? { ...x, status: "APPROVED", approved_at: new Date().toISOString() } : x
                                  )
                                );
                                const refreshed = await listCashHolders({ per_page: 100 });
                                setHolders(refreshed.data);
                              } catch (e) {
                                const err = e as { response?: { data?: { message?: string } } };
                                alert(err.response?.data?.message ?? "Tidak bisa approve (server error).");
                              } finally {
                                setApprovingId(null);
                              }
                            }}
                          >
                            {approvingId === m.id ? "Approving…" : "Approve"}
                          </button>

                          <button
                            type="button"
                            className="button button-outline"
                            onClick={async () => {
                              const reason = window.prompt("Alasan reject?");
                              if (!reason) return;
                              try {
                                await rejectCashMove(m.id, { reason });
                              } catch (e) {
                                const err = e as { response?: { data?: { message?: string } } };
                                alert(err.response?.data?.message ?? "Tidak bisa reject (403).");
                                return;
                              }
                              setRows((arr) =>
                                arr.map((x) =>
                                  x.id === m.id
                                    ? { ...x, status: "REJECTED", reject_reason: reason, approved_at: new Date().toISOString() }
                                    : x
                                )
                              );
                              const refreshed = await listCashHolders({ per_page: 100 });
                              setHolders(refreshed.data);
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="card">
        <div className="pager">
          <div>Hal. {meta.current_page} / {meta.last_page}</div>
          <div className="pager-actions">
            <button
              type="button"
              className="button"
              disabled={meta.current_page <= 1}
              onClick={() => setQ((s) => ({ ...s, page: (s.page ?? 1) - 1 }))}
            >
              Prev
            </button>
            <button
              type="button"
              className="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setQ((s) => ({ ...s, page: (s.page ?? 1) + 1 }))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
