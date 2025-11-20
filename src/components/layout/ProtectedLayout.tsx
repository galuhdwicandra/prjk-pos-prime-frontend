import React, { useState, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../nav/Sidebar";
import Topbar from "../nav/Topbar"; // ⬅️ pastikan impor ini
import { useAuth } from "../../store/auth";

type ProtectedLayoutProps = Record<string, never>;

export default function ProtectedLayout(_: ProtectedLayoutProps): React.ReactElement {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  const handleLogout = useCallback(() => {
    if (typeof (auth as { logout?: () => void }).logout === "function") {
      (auth as { logout: () => void }).logout();
      return;
    }
    try { localStorage.removeItem("token"); } catch {}
    navigate("/login", { replace: true });
  }, [auth, navigate]);

  return (
    <div className="layout-root">
      {/* ✅ Topbar resmi (bukan header inline lagi) */}
      <Topbar onMenuClick={openSidebar} onLogout={handleLogout} />

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      {/* Konten utama */}
      <main className="main-content" style={{ padding: "16px" }}>
        <Outlet />
      </main>
    </div>
  );
}
