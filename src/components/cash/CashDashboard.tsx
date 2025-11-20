// src/components/cash/CashDashboard.tsx
import React, { useEffect, useState } from "react";
import { listCashHolders, listCashMoves } from "../../api/cash";
import type { ID } from "../../types/pos";

type Props = { branchId?: ID };

export default function CashDashboard({ branchId }: Props): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ total_balance: number; pending_moves: number } | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    Promise.all([
      listCashHolders({ branch_id: branchId, per_page: 100 }),
      listCashMoves({ status: "SUBMITTED", per_page: 1 }), // hanya ambil total count
    ])
      .then(([holders, moves]) => {
        if (!alive) return;
        const total = holders.data.reduce((acc, h) => acc + (h.balance ?? 0), 0);
        setSummary({ total_balance: total, pending_moves: moves.meta.total });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        const msg = (e as { message?: string }).message ?? "Gagal memuat ringkasan kas.";
        setError(msg);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [branchId]);

  if (loading) {
    return <div className="card">Loading cash summary…</div>;
  }
  if (error) {
    return <div className="card">{error}</div>;
  }
  if (!summary) {
    return <div className="card">Data kosong.</div>;
  }

  return (
    <div className="form-row form-row--2">
      <CardStat
        title="Total Balance (All Holders)"
        value={summary.total_balance}
      />
      <CardStat
        title="Pending (SUBMITTED) Moves"
        value={summary.pending_moves}
      />
    </div>
  );
}

function CardStat(props: { title: string; value: number }): React.ReactElement {
  const { title, value } = props;
  return (
    <div className="card">
      <div>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>
        {new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(value)}
      </div>
    </div>
  );
}
