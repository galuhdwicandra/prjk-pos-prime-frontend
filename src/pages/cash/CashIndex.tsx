// src/pages/cash/CashIndex.tsx
import React, { useState } from "react";
import CashDashboard from "../../components/cash/CashDashboard";
import CashHoldersTable from "../../components/cash/CashHoldersTable";
import SubmitCashDialog from "../../components/cash/SubmitCashDialog";
import type { CashHolder } from "../../types/cash";
import { useAuth } from "../../store/auth";

export default function CashIndex(): React.ReactElement {
  const { user } = useAuth();
  const [open, setOpen] = useState<boolean>(false);
  const [from, setFrom] = useState<CashHolder | null>(null);

  return (
    <div className="page">
      <h1 className="page-title">Cash Tracking</h1>

      {/* Section: KPI / Ringkasan Kas */}
      <div className="card">
        <CashDashboard branchId={user?.cabang_id ?? undefined} />
      </div>

      {/* Section: Holders + Action */}
      <div className="toolbar">
        <div className="toolbar-title">Holders</div>
        <div className="toolbar-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => setOpen(true)}
          >
            Ajukan Setoran
          </button>
        </div>
      </div>

      {/* Tabel Holders */}
      <div className="card">
        <CashHoldersTable
          branchId={user?.cabang_id ?? undefined}
          onPickSubmit={(h) => {
            setFrom(h);
            setOpen(true);
          }}
        />
      </div>

      {/* Dialog Setoran */}
      <SubmitCashDialog
        open={open}
        defaultFrom={from}
        onClose={() => {
          setOpen(false);
          setFrom(null);
        }}
        onSubmitted={() => {
          /* optional toast/refresh elsewhere */
        }}
      />
    </div>
  );
}
