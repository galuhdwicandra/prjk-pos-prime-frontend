// src/components/delivery/DeliveryStatusStepper.tsx
import React from "react";
import type { DeliveryStatus } from "../../types/delivery";

const ORDER: DeliveryStatus[] = [
  "REQUESTED", "ASSIGNED", "PICKED_UP", "ON_ROUTE", "DELIVERED"
];

type Props = {
  status: DeliveryStatus;
};

export default function DeliveryStatusStepper({ status }: Props): React.ReactElement {
  const idx = ORDER.indexOf(status as DeliveryStatus);

  // helper kecil untuk memilih varian badge
  const badgeClassFor = (i: number): string => {
    if (i < idx) return "badge badge-success";     // sudah lewat
    if (i === idx) return "badge";                 // posisi saat ini (netral/brand default)
    return "badge";                                // belum dicapai (netral)
  };

  const isTerminalBad = status === "FAILED" || status === "CANCELLED";

  return (
    <div>
      {/* Step badges + separator sederhana (tanpa util baru) */}
      {ORDER.map((s, i) => (
        <React.Fragment key={s}>
          <span className={badgeClassFor(i)}>{s}</span>
          {i < ORDER.length - 1 && <span>{' '}›{' '}</span>}
        </React.Fragment>
      ))}

      {/* Status terminal */}
      {isTerminalBad && (
        <>
          {' '}
          <span className="badge badge-danger">{status}</span>
        </>
      )}
    </div>
  );
}
