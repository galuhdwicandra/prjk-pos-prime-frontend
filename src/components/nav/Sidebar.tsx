// src/components/nav/Sidebar.tsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../store/auth";
import { filterMenuByRole, GROUP_ORDER, groupOf, type GroupKey } from "../../nav-config";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const LS_KEY = "pos-prime.sidebar.openGroups";

export default function Sidebar({ open, onClose }: SidebarProps): React.ReactElement {
  const { hasRole } = useAuth();
  const items = filterMenuByRole(hasRole); // data asli (bukan dummy)

  // Kelompokkan item berdasarkan group yang didefinisikan di nav-config.ts
  const sections = useMemo(
    () =>
      GROUP_ORDER
        .map((grp) => ({
          group: grp,
          items: items.filter((it) => groupOf(it.key) === grp),
        }))
        .filter((s) => s.items.length > 0),
    [items]
  );

  // Inisialisasi grup yang dibuka (default: Umum & POS terbuka)
  const defaultOpen: Record<GroupKey, boolean> = GROUP_ORDER.reduce((acc, g) => {
    acc[g as GroupKey] = g === "Umum" || g === "POS";
    return acc;
  }, {} as Record<GroupKey, boolean>);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(defaultOpen);

  // Restore dari localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, boolean>;
        setOpenGroups((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simpan ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(openGroups));
    } catch {}
  }, [openGroups]);

  function toggleGroup(grp: GroupKey) {
    setOpenGroups((s) => ({ ...s, [grp]: !s[grp] }));
  }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          aria-hidden="true"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.28)", zIndex: 39 }}
        />
      )}

      <aside
        aria-label="Navigasi"
        className="sidebar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .2s ease",
          zIndex: 40,
          background: "#fff",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Brand */}
        <div className="sidebar-brand" style={{ padding: "16px 20px", fontWeight: 700, fontSize: 16 }}>
          POS Prime <span style={{ opacity: 0.6, fontWeight: 500 }}>Katalog</span>
        </div>

        {/* Dropdown (grouped) — clean, tanpa rounded */}
        <nav className="nav" aria-label="Menu utama">
          <div className="navlist" style={{ paddingBottom: 16 }}>
            {sections.map((sec) => {
              const isOpen = !!openGroups[sec.group];
              return (
                <div key={sec.group}>
                  {/* Header Grup sebagai tombol dropdown */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(sec.group)}
                    aria-expanded={isOpen}
                    aria-controls={`grp-${sec.group}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      padding: "12px 20px",
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                      color: "rgba(0,0,0,.62)",
                      fontWeight: 700,
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                    }}
                    title={sec.group}
                  >
                    <span style={{ flex: 1, textAlign: "left" }}>{sec.group}</span>
                    {/* Chevron sederhana */}
                    <span
                      aria-hidden="true"
                      style={{
                        display: "inline-block",
                        transition: "transform .15s ease",
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                    >
                      ▶
                    </span>
                  </button>

                  {/* Isi grup */}
                  <div id={`grp-${sec.group}`} role="region" aria-label={sec.group}>
                    {isOpen &&
                      sec.items.map((item) => (
                        <NavLink
                          key={item.key}
                          to={item.to}
                          className={({ isActive }) => "navitem" + (isActive ? " is-active" : "")}
                          onClick={onClose}
                          title={item.label}
                          style={{
                            display: "block",
                            padding: "10px 28px 10px 28px", // agak menjorok agar hierarki terasa
                            fontSize: 14,
                            textDecoration: "none",
                            color: "inherit",
                          }}
                        >
                          <span>{item.label}</span>
                        </NavLink>
                      ))}
                  </div>

                  {/* Pemisah antar grup (jarak vertikal tipis) */}
                  <div style={{ height: 6 }} />
                </div>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
