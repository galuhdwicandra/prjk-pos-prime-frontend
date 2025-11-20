# Roadmap Ceklis — Frontend (Inertia + React + TypeScript)

> **Repo:** `pos-prime-frontend/` • **Data real dari API** • **TypeScript ketat** • **Role-based UI** • **Hard delete dengan konfirmasi**

## Legend
- ☐ Belum
- ☑ Selesai
- (K) = Konfirmasi sebelum lanjut

---

## F0 — Fondasi & Auth
- ☑  Setup .env (API base, normalisasi URL)
- ☑  Client API (Bearer token, interceptors 401/403/422)
- ☑  Types + API: auth (login/me/logout)
- ☑  Store: auth/session (`useAuth`, `hasRole`)
- ☑  Pages: Login
- ☑ (K) Protected layout & nav by role

## F1 — Users
- ☑  Types + API: users CRUD, set role & cabang
- ☑  Components: UserTable, UserForm, RoleBadge
- ☑  Pages: UsersIndex, UserCreate/Edit
- ☑  (K) Guard akses (Superadmin/Admin Cabang)

## F2 — Cabang & Gudang
- ☑ Types + API: branches, warehouses
- ☑ Components: BranchCard, WarehouseSummary
- ☑ Pages: BranchIndex, BranchDetail
- ☑ (K) Navigasi & scope data

## F3 — Kategori
- ☑ Types + API
- ☑ Components: CategoryForm, CategoryCard/Table
- ☑ Pages: CategoryIndex
- ☑ (K) Validasi & blokir hapus bila terpakai

## F4 — Produk, Varian, Media
- ☑ Types + API: products, variants, media
- ☑ Components: ProductTable, VariantManager, PriceInput, **ImageDropzone**
- ☑ Pages: ProductIndex, ProductDetail (tab Info/Varian & Stok)
- ☑ (K) Preview & upload multipart, pesan error jelas

## F5 — Stok Gudang
- ☑ Types + API: stock
- ☑ Components: StockTable, SetInitialStockDialog, LowStockIndicator
- ☑ Pages: StockIndex
- ☑ (K) Konsistensi angka dengan backend

## F6 — POS (Orders & Payments)
- ☑ Store: cart
- ☑ Components: ProductSearch/Barcode, CartPanel, CheckoutDialog, **ReceiptPreview**
- ☑ Pages: POS/Orders
- ☑ (K) Checkout → stok berkurang, tampil struk & tombol Print/WA

## F7 — Daftar Pesanan
- ☑ Types + API: orders
- ☑ Components: OrdersTable, OrderDetailDialog, EditOrderDialog
- ☑ Pages: OrdersIndex
- ☑ (K) Edit item/qty/harga → total update

## F8 — Pickup & Delivery
- ☑ Types + API: delivery tasks
- ☑ Components: DeliveryTabs, AssignCourierSelect, DeliveryStatusStepper, DamageClaimDialog (upload foto)
- ☑ Pages: DeliveryIndex, DeliveryDetail
- ☑ (K) Auto-assign kurir & update status

## F9 — Cash Tracking
- ☑ Types + API: cash
- ☑ Components: CashDashboard, CashHoldersTable, SubmitCashDialog, AuditTrail
- ☑ Pages: CashIndex, CashHistory
- ☑ (K) Alur submit → approve/reject

## F10 — Fee Tracking
- ☑ Types + API: fees
- ☑ Components: FeeTable, FeeDetailDialog, PeriodFilter
- ☑ Pages: FeeIndex
- ☑ (K) Visibilitas sesuai role; export

## F11 — Customers
- ☑ Types + API: customers
- ☑ Components: CustomerTable, CustomerStageBadge, CustomerTimeline
- ☑ Pages: CustomersIndex, CustomerDetail
- ☑ (K) Data auto-create dari checkout terlihat

## F12 — Dashboard
- ☑ Components: KPIStatCards, Sales7DaysChart, TopProductsList, LowStockList, QuickActions
- ☑ Pages: DashboardHome
- ☑ (K) Angka, chart, dan daftar sinkron dengan backend

## F13 — Settings
- ☑ Types + API: settings
- ☑ Components: SettingsForm, PreferenceToggles, BackupRestorePanel
- ☑ Pages: SettingsIndex
- ☑ (K) Review UX dan konsistensi

## F14 - Akuntansi (COA, Jurnal, Laporan)
- ☐ **Types + API**
  - `Account` (COA): id, code, name, type, parent_id, is_active
  - `JournalEntry` (header): id, date, number, description, status, branch_id, period
  - `JournalLine`: account_id, debit, credit, ref_type/ref_id
  - `Reports`: trial-balance, general-ledger, profit-loss (P&L), balance-sheet
  - Endpoints: `/accounting/accounts`, `/accounting/journals`, `/accounting/periods`, `/accounting/reports/*`
- ☐ **Components**
  - `AccountTable`, `AccountFormDialog` (tree & flat view, toggle aktif)
  - `JournalTable`, `JournalEditor` (**validasi debit=credit** realtime, kalkulasi subtotal)
  - `ReportFilterBar` (tanggal/periode/cabang/akun), `ReportTable` (paging/CSV print-friendly)
- ☐ **Pages**
  - `AccountingAccountsIndex`
  - `AccountingJournalsIndex` (tab DRAFT/POSTED, aksi POST dengan konfirmasi)
  - `AccountingReports` (tabs: Trial Balance / GL / P&L / Balance Sheet)
- ☐ **Integrasi & UX**
  - Deep-link dari Order/Payment/Fee ke `JournalEntry` terkait (ref badge)
  - Guard role: Superadmin/Admin Cabang full access; lainnya read-only (opsional)
  - Empty/loading/error states konsisten; notifikasi 422/403/409 jelas
- ☐ **(K) Sinkronisasi Kontrak**
  - Skema payload Journal (header+lines), tipe akun & kode, serta parameter filter laporan
  - Format ekspor tabel (CSV/print) dan penomoran jurnal

---

## Uji & Kualitas (Lintasan Tetap per Modul)
- ☐ Lint + type-check bersih (tanpa `any`, tanpa `JSX.Element` mentah)
- ☐ Loading/empty/error states tertangani
- ☐ Guard peran (menu, tombol aksi) konsisten
- ☐ Drag & drop upload (bila relevan) berjalan mulus
- ☐ Hard delete butuh konfirmasi + toast
