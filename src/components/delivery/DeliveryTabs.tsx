// src/components/delivery/DeliveryTabs.tsx
import React from "react";
import type { DeliveryStatus } from "../../types/delivery";

type Tab = { key: DeliveryStatus | "ALL"; label: string };
const TABS: Tab[] = [
  { key: "ALL",        label: "Semua" },
  { key: "REQUESTED",  label: "Requested" },
  { key: "ASSIGNED",   label: "Assigned" },
  { key: "PICKED_UP",  label: "Picked" },
  { key: "ON_ROUTE",   label: "On Route" },
  { key: "DELIVERED",  label: "Delivered" },
  { key: "FAILED",     label: "Failed" },
  { key: "CANCELLED",  label: "Cancelled" },
];

type Props = {
  value: Tab["key"];
  onChange: (k: Tab["key"]) => void;
};

export default function DeliveryTabs({ value, onChange }: Props): React.ReactElement {
  return (
    <div aria-label="Delivery tabs" role="tablist">
      {TABS.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            aria-pressed={active}
            onClick={() => onChange(t.key)}
            className={`button ${active ? "button-primary" : "button-ghost"}`}
            style={{ marginRight: 8, marginBottom: 8 }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
