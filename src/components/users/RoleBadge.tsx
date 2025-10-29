// src/components/users/RoleBadge.tsx
import React from "react";
import type { Role } from "../../types/user";

const LABEL: Record<Role, string> = {
  superadmin: "Superadmin",
  admin_cabang: "Admin Cabang",
  gudang: "Gudang",
  kasir: "Kasir",
  sales: "Sales",
  kurir: "Kurir",
};

// Mapping ke varian badge kecil yang sudah ada di index.css
const TONE: Record<Role, "badge-success" | "badge-warning" | "badge-danger"> = {
  superadmin: "badge-danger",     // aksen kuat (otoritas tertinggi)
  admin_cabang: "badge-success",  // status otorisasi OK
  gudang: "badge-warning",        // operasional/alert stok
  kasir: "badge-success",         // transaksi OK
  sales: "badge-success",         // target/closing
  kurir: "badge-warning",         // status antar/jemput
};

export default function RoleBadge({ role }: { role: Role }): React.ReactElement {
  return (
    <span className={`badge ${TONE[role]}`} title={LABEL[role]}>
      {LABEL[role]}
    </span>
  );
}
