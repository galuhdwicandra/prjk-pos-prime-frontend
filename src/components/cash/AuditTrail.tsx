// src/components/cash/AuditTrail.tsx
import React from "react";
import type { CashMove } from "../../types/cash";

type Props = {
  move: CashMove;
  /** Opsional: parent mengoper handler untuk membuka SubmitCashDialog */
  onOpenSubmit?: () => void;
};

export default function AuditTrail({ move, onOpenSubmit }: Props): React.ReactElement {
  return (
    <div>
      <div className="section-header">
        <div className="section-title">Audit Trail</div>

        {onOpenSubmit ? (
          <div className="section-actions">
            <button type="button" className="button button-primary" onClick={onOpenSubmit}>
              Ajukan Setoran
            </button>
          </div>
        ) : null}
      </div>

      <ul className="list-plain">
        <li>
          Submitted: <span className="mono">{move.submitted_at}</span> by #{move.submitted_by}
        </li>

        {move.status === "APPROVED" ? (
          <li>
            Approved: <span className="mono">{move.approved_at}</span> by #{move.approved_by}
          </li>
        ) : null}

        {move.status === "REJECTED" ? (
          <li>
            Rejected: <span className="mono">{move.approved_at}</span> reason: “{move.reject_reason ?? "-"}”
          </li>
        ) : null}
      </ul>
    </div>
  );
}
