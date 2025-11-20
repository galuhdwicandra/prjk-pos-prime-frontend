// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "./store/auth";
import LoginPage from "./pages/auth/Login";
import ProtectedLayout from "./components/layout/ProtectedLayout";
import RequireRole from "./components/routing/RequireRole";

import UsersIndex from "./pages/users/Index";
import CabangsPage from "./pages/master/Cabangs";
import WarehousesPage from "./pages/master/Warehouses";
import CategoryIndex from "./pages/categories/CategoryIndex";
import ProductsPage from "./pages/products/ProductsPage";
import ProductDetail from "./pages/products/ProductDetail";
import StockIndex from "./pages/stock/StockIndex";
import OrdersPage from "./pages/pos/Orders";
import OrdersIndex from "./pages/pos/OrdersIndex";
import DeliveryIndex from "./pages/delivery/DeliveryIndex";
import DeliveryDetail from "./pages/delivery/DeliveryDetail";
import CashIndex from "./pages/cash/CashIndex";
import CashHistory from "./pages/cash/CashHistory";
import FeeIndex from "./pages/fees/FeeIndex";
import FeeMaster from "./pages/fees/FeeMaster";
import CustomersIndex from "./pages/customers/CustomersIndex";
import CustomerDetail from "./pages/customers/CustomerDetail";
import DashboardHome from "./pages/DashboardHome";
import SettingsIndex from "./pages/settings/SettingsIndex";
import AccountingAccountsIndex from "./pages/accounting/AccountingAccountsIndex";
import AccountingJournalsIndex from "./pages/accounting/AccountingJournalsIndex";
import AccountingReports from "./pages/accounting/AccountingReports";

function LegacyProductAlias() {
  const { id } = useParams();
  return <Navigate to={`/catalog/products/${id}`} replace />;
}

export default function App(): React.ReactElement {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public (tanpa navbar) */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected (dengan navbar + sidebar) */}
          <Route element={<ProtectedLayout />}>
            {/* Root → Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard (RBAC) */}
            <Route
              path="/dashboard"
              element={
                <RequireRole
                  roles={[
                    "superadmin",
                    "admin_cabang",
                    "kasir",
                    "sales",
                    "kurir",
                    "gudang",
                  ]}
                >
                  <DashboardHome />
                </RequireRole>
              }
            />

            {/* Users */}
            <Route
              path="/users"
              element={
                <RequireRole roles={["superadmin", "admin_cabang"]}>
                  <UsersIndex />
                </RequireRole>
              }
            />

            {/* F2 — Cabang & Gudang: sudah punya RequireRole internal di halaman */}
            <Route path="/master/cabangs" element={<CabangsPage />} />
            <Route path="/master/warehouses" element={<WarehousesPage />} />

            {/* Kategori & Produk */}
            <Route
              path="/master/categories"
              element={
                <RequireRole roles={["superadmin", "admin_cabang"]}>
                  <CategoryIndex />
                </RequireRole>
              }
            />
            <Route
              path="/catalog/products"
              element={
                <RequireRole roles={["superadmin", "admin_cabang"]}>
                  <ProductsPage />
                </RequireRole>
              }
            />
            <Route
              path="/catalog/products/:id"
              element={
                <RequireRole roles={["superadmin", "admin_cabang"]}>
                  <ProductDetail />
                </RequireRole>
              }
            />
            {/* Alias/redirect supaya URL lama juga masuk */}
            <Route path="/products/:id" element={<LegacyProductAlias />} />

            {/* Stok */}
            <Route
              path="/stocks"
              element={
                <RequireRole roles={["superadmin", "admin_cabang", "gudang"]}>
                  <StockIndex />
                </RequireRole>
              }
            />

            {/* POS */}
            <Route
              path="/pos/orders"
              element={
                <RequireRole roles={["superadmin", "admin_cabang", "kasir", "sales"]}>
                  <OrdersPage />
                </RequireRole>
              }
            />
            <Route path="/pos" element={<Navigate to="/pos/orders" replace />} />

            <Route
              path="/pos/orders-list"
              element={
                <RequireRole roles={["superadmin", "admin_cabang", "kasir", "sales"]}>
                  <OrdersIndex />
                </RequireRole>
              }
            />

            {/* Delivery */}
            <Route
              path="/delivery"
              element={
                <RequireRole roles={["superadmin", "admin_cabang", "kasir", "kurir","gudang"]}>
                  <DeliveryIndex />
                </RequireRole>
              }
            />
            <Route
              path="/delivery/:id"
              element={
                <RequireRole roles={["superadmin", "admin_cabang", "kasir", "kurir","gudang"]}>
                  <DeliveryDetail />
                </RequireRole>
              }
            />

            {/* Cash (samakan role dengan menu: superadmin, admin_cabang, kasir) */}
            <Route
              path="/cash"
              element={
                <RequireRole roles={["superadmin", "admin_cabang", "kasir"]}>
                  <CashIndex />
                </RequireRole>
              }
            />
            <Route
              path="/cash/history"
              element={
                <RequireRole roles={["superadmin", "admin_cabang", "kasir"]}>
                  <CashHistory />
                </RequireRole>
              }
            />

            {/* Fees */}
            <Route
              path="/fees"
              element={
                <RequireRole roles={["superadmin", "admin_cabang", "kasir", "sales", "kurir"]}>
                  <FeeIndex />
                </RequireRole>
              }
            />
            <Route
              path="/fees/master"
              element={
                <RequireRole roles={["superadmin", "admin_cabang"]}>
                  <FeeMaster />
                </RequireRole>
              }
            />

            {/* Customers */}
            <Route
              path="/customers"
              element={
                <RequireRole roles={["superadmin", "admin_cabang", "kasir", "sales"]}>
                  <CustomersIndex />
                </RequireRole>
              }
            />
            <Route
              path="/customers/:id"
              element={
                <RequireRole roles={["superadmin", "admin_cabang", "kasir", "sales"]}>
                  <CustomerDetail />
                </RequireRole>
              }
            />

            <Route
              path="/settings"
              element={
                <RequireRole roles={["superadmin", "admin_cabang", "kasir"]}>
                  <SettingsIndex />
                </RequireRole>
              }
            />
            
            {/* Accounting */}
            <Route
              path="/accounting"
              element={<Navigate to="/accounting/reports" replace />}
            />

            <Route
              path="/accounting/accounts"
              element={
                <RequireRole roles={["superadmin", "admin_cabang"]}>
                  <AccountingAccountsIndex />
                </RequireRole>
              }
            />

            <Route
              path="/accounting/journals"
              element={
                <RequireRole roles={["superadmin", "admin_cabang"]}>
                  <AccountingJournalsIndex />
                </RequireRole>
              }
            />

            <Route
              path="/accounting/reports"
              element={
                <RequireRole roles={[
                  "superadmin",
                  "admin_cabang",
                  "kasir",
                  "sales",
                  "kurir",
                  "gudang"
                ]}>
                  <AccountingReports />
                </RequireRole>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
