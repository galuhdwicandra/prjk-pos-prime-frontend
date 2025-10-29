// src/pages/auth/Login.tsx
import { useEffect } from "react";
import { useAuth } from "../../store/auth";
import { useNavigate } from "react-router-dom";
import LoginForm from "../../components/auth/LoginForm";

export default function LoginPage(): React.ReactElement {
  const { isAuthenticated, status } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const wrapperStyle: React.CSSProperties = {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "28rem", // ≈ 448px, cukup proporsional di desktop maupun mobile
  };

  // skeleton ringan saat cek sesi
  if (status === "idle" || status === "loading") {
    return (
      <div style={wrapperStyle}>
        <div className="card" style={cardStyle}>
          <p className="text-sm opacity-70">Memeriksa sesi…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      {/* gunakan komponen Card dari index.css */}
      <div className="card" style={cardStyle}>
        <h1 className="mb-2 text-xl font-semibold" style={{ textAlign: "center" }}>POS Prime</h1>
        <p className="mb-6 text-sm opacity-70" style={{ textAlign: "center" }}>
          Silakan masuk untuk melanjutkan.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
