// src/pages/fees/FeeIndex.tsx
import { useEffect, useMemo, useState } from "react";
import { listFees, exportFeesCsv } from "../../api/pos";
import type { FeeEntry, FeePaged, FeePayStatus, ID } from "../../types/pos";
import PeriodFilter, { type Period } from "../../components/fees/PeriodFilter";
import FeeTable from "../../components/fees/FeeTable";
import FeeDetailDialog from "../../components/fees/FeeDetailDialog";
import { useAuth } from "../../store/auth";
import CabangSelect from "../../components/stock/CabangSelect";

export default function FeeIndex(): React.ReactElement {
  const { user } = useAuth();
  const [rows, setRows] = useState<FeeEntry[]>([]);
  const [meta, setMeta] = useState<FeePaged["meta"]>({ current_page: 1, per_page: 20, total: 0, last_page: 1 });
  const [period, setPeriod] = useState<Period>({ from: undefined, to: undefined });
  const [branchId, setBranchId] = useState<ID | undefined>(undefined);
  const [status, setStatus] = useState<FeePayStatus | "">("");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FeeEntry | null>(null);

  // Enforce visibility
  useEffect(() => {
    let ignore = false;
    const q = {
      cabang_id: branchId,
      from: period.from,
      to: period.to,
      pay_status: (status || undefined) as FeePayStatus | undefined,
      page,
      per_page: perPage,
    };
    setLoading(true);
    setError(null);
    listFees(q)
      .then((res) => {
        if (ignore) return;
        setRows(res.data);
        setMeta(res.meta);
      })
      .catch((e: unknown) => {
        if (ignore) return;
        setError(e instanceof Error ? e.message : "Gagal memuat data.");
        setRows([]);
      })
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [branchId, period.from, period.to, status, page, perPage]);

  const canSwitchBranch = useMemo(() => user?.role === "superadmin" || user?.role === "admin_cabang", [user?.role]);

  async function onExport(): Promise<void> {
    const blob = await exportFeesCsv({
      cabang_id: branchId,
      from: period.from,
      to: period.to,
      pay_status: (status || undefined) as FeePayStatus | undefined,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fee_entries.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2>Fee Tracking</h2>
          <button className="button button-primary" onClick={onExport} disabled={loading}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="form-row form-row--3">
          {/* Periode */}
          <div>
            <label>Periode</label>
            <PeriodFilter value={period} onChange={setPeriod} />
          </div>

          {/* Status */}
          <div>
            <label>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus((e.target.value || "") as FeePayStatus | "")}
              className="select"
            >
              <option value="">Semua</option>
              <option value="UNPAID">UNPAID</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="PAID">PAID</option>
            </select>
          </div>

          {/* Cabang (khusus superadmin/admin_cabang) */}
          {canSwitchBranch ? (
            <div>
              <label>Cabang</label>
              <CabangSelect value={branchId} onChange={(id) => setBranchId(id ?? undefined)} />
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* Page size */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <label>Per halaman</label>
          <select
            className="select"
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Tabel */}
      <FeeTable rows={rows} loading={loading} error={error} onSelect={setSelected} onExport={onExport} />

      {/* Pager */}
      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            Halaman {meta.current_page} / {meta.last_page} • Total {meta.total}
          </div>
          <div style={{ display: "inline-flex", gap: 8 }}>
            <button
              className="button"
              disabled={meta.current_page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              « Prev
            </button>
            <button
              className="button"
              disabled={meta.current_page >= meta.last_page || loading}
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            >
              Next »
            </button>
          </div>
        </div>
      </div>

      {/* Detail */}
      <FeeDetailDialog open={!!selected} onClose={() => setSelected(null)} entry={selected ?? undefined} />
    </div>
  );
}
