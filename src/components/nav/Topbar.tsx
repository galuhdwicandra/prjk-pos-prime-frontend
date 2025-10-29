import React from "react";
import { useAuth } from "../../store/auth";

type TopbarProps = {
  onMenuClick: () => void;
  onLogout?: () => void;
};

export default function Topbar({ onMenuClick, onLogout }: TopbarProps): React.ReactElement {
  const { user, logout } = useAuth();

  // inisial user (data asli, bukan dummy)
  const initials =
    (user?.name ?? "")
      .split(" ")
      .filter(Boolean)
      .map((s) => s[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "U";

  // role asli (pastikan sudah ada di auth store)
  const roleLabel = user?.role ?? "";

  const doLogout = () => {
    if (onLogout) { onLogout(); return; }
    void logout();
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        height: 64,
        borderBottom: "1px solid rgba(0,0,0,.08)",
        background: "rgba(255,255,255,.9)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 1px 8px rgba(0,0,0,.06)",
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* Kiri: tombol menu + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <button
            type="button"
            onClick={onMenuClick}
            className="button button-ghost"
            style={{ paddingLeft: 12, paddingRight: 12 }}
            aria-label="Buka menu"
            title="Menu"
          >
            {/* ikon hamburger sederhana */}
            <span aria-hidden style={{ display: "inline-block", width: 22, color: "#334155" }}>
              <span style={{ display: "block", height: 2, borderRadius: 2, background: "currentColor" }} />
              <span style={{ margin: "5px 0", display: "block", height: 2, borderRadius: 2, background: "currentColor" }} />
              <span style={{ display: "block", height: 2, borderRadius: 2, background: "currentColor" }} />
            </span>
          </button>

          <div style={{ fontWeight: 700, letterSpacing: ".02em", color: "#1f2937" }}>
            POS Prime <span style={{ opacity: 0.6 }}>Katalog</span>
          </div>
        </div>

        {/* Tengah: spacer (tempat search nanti jika diperlukan) */}
        <div style={{ flex: 1, minWidth: 40 }} />

        {/* Kanan: avatar inisial + nama + role (badge) + keluar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              height: 36,
              width: 36,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "9999px",
              background: "var(--color-primary)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 12,
              boxShadow: "0 2px 6px rgba(0,0,0,.12)",
              flex: "0 0 auto",
            }}
          >
            {initials}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span
              title={user?.name}
              style={{
                maxWidth: 180,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.name}
            </span>
            {roleLabel ? (
              <span className="badge" style={{ textTransform: "capitalize", whiteSpace: "nowrap" }}>
                {roleLabel}
              </span>
            ) : null}
          </div>

          <button
            onClick={doLogout}
            className="button button-outline"
            title="Keluar"
            aria-label="Keluar"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
