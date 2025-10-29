// src/nav-config.ts
import type { Role } from "./types/user";

export type MenuItem = {
  key: string;
  label: string;
  to: string;
  roles: readonly Role[];
};

function r(...roles: Role[]): readonly Role[] {
  return roles;
}

/**
 * OPSIONAL untuk Sidebar: urutan grup & helper pengelompokan.
 * Tidak wajib dipakai—hanya disediakan agar Sidebar bisa "clean" tanpa hardcode.
 */
export type GroupKey =
  | "Umum"
  | "POS"
  | "Pickup & Delivery"
  | "Katalog"
  | "Gudang & Stok"
  | "Pelanggan"
  | "Cash"
  | "Fees"
  | "Akuntansi"
  | "Administrasi"
  | "Lainnya";

export const GROUP_ORDER: GroupKey[] = [
  "Umum",
  "Katalog",
  "Gudang & Stok",
  "Pelanggan",
  "POS",
  "Pickup & Delivery",
  "Cash",
  "Fees",
  "Akuntansi",
  "Administrasi",
  "Lainnya",
];

/** Mapping kunci → grup (berdasarkan key yang SUDAH ADA, tidak mengubah apa pun). */
export function groupOf(key: string): GroupKey {
  if (key === "dashboard") return "Umum";

  if (key === "pos" || key === "orders.list") return "POS";

  if (key === "delivery") return "Pickup & Delivery";

  if (key === "products" || key === "master.categories") return "Katalog";

  if (key === "stock" || key === "master.warehouses") return "Gudang & Stok";

  if (key === "customers") return "Pelanggan";

  if (key === "cash" || key === "cash.history") return "Cash";

  if (key === "fees" || key === "fees.master") return "Fees";

  if (
    key === "accounting.accounts" ||
    key === "accounting.journals" ||
    key === "accounting.reports"
  ) {
    return "Akuntansi";
  }

  if (key === "users" || key === "master.cabangs") return "Administrasi";

  if (key === "settings") return "Lainnya";

  return "Lainnya";
}

/**
 * MENU: semua item dipertahankan utuh (key/label/to/roles sama),
 * hanya DIURUTKAN supaya alur navigasi lebih logis (per grup).
 */
export const MENU: MenuItem[] = [
  // === Umum ===
  { key: "dashboard", label: "Dashboard", to: "/", roles: ["superadmin", "admin_cabang", "kasir", "kurir"] as const },

  // === POS ===
  { key: "pos", label: "POS", to: "/pos/orders", roles: ["superadmin", "admin_cabang", "kasir", "sales"] },
  { key: "orders.list", label: "Daftar Pesanan", to: "/pos/orders-list", roles: ["superadmin", "admin_cabang", "kasir", "sales"] },

  // === Pickup & Delivery ===
  { key: "delivery", label: "Pickup & Delivery", to: "/delivery", roles: ["superadmin", "admin_cabang", "kasir", "kurir", "gudang"] },

  // === Katalog ===
  { key: "master.categories", label: "Kategori", to: "/master/categories", roles: ["superadmin", "admin_cabang"] },
  { key: "products", label: "Produk", to: "/catalog/products", roles: ["superadmin", "admin_cabang"] },

  // === Gudang & Stok ===
  { key: "stock", label: "Stok Gudang", to: "/stocks", roles: ["superadmin", "admin_cabang", "gudang"] },
  { key: "master.warehouses", label: "Gudang", to: "/master/warehouses", roles: ["superadmin", "admin_cabang", "gudang"] },

  // === Pelanggan ===
  { key: "customers", label: "Pelanggan", to: "/customers", roles: ["superadmin", "admin_cabang", "kasir", "sales"] },

  // === Cash ===
  { key: "cash", label: "Cash", to: "/cash", roles: ["superadmin", "admin_cabang", "kasir"] },
  { key: "cash.history", label: "Riwayat Cash", to: "/cash/history", roles: ["superadmin", "admin_cabang", "kasir"] },

  // === Fees ===
  { key: "fees", label: "Fees", to: "/fees", roles: ["superadmin", "admin_cabang", "kasir", "sales", "kurir"] },
  { key: "fees.master", label: "Fees (Master)", to: "/fees/master", roles: ["superadmin", "admin_cabang"] },

  // === Akuntansi ===
  { key: "accounting.accounts", label: "COA", to: "/accounting/accounts", roles: r("superadmin", "admin_cabang") },
  { key: "accounting.journals", label: "Jurnal", to: "/accounting/journals", roles: r("superadmin", "admin_cabang") },
  { key: "accounting.reports", label: "Akuntansi (Laporan)", to: "/accounting/reports", roles: r("superadmin", "admin_cabang") },

  // === Administrasi ===
  { key: "users", label: "Users", to: "/users", roles: ["superadmin", "admin_cabang"] },
  { key: "master.cabangs", label: "Cabang", to: "/master/cabangs", roles: ["superadmin", "admin_cabang"] },

  // === Lainnya ===
  { key: "settings", label: "Settings", to: "/settings", roles: r("superadmin", "admin_cabang", "kasir") },
];

export function filterMenuByRole(
  can: (...r: Role[]) => boolean
): MenuItem[] {
  return MENU.filter((m) => can(...m.roles));
}
