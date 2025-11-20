// src/components/routing/RequireAuth.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../store/auth";

export default function RequireAuth(props: { children: React.ReactElement }): React.ReactElement {
  const { isAuthenticated, status } = useAuth();
  const loc = useLocation();

  if (status === "idle" || status === "loading") {
    return <div className="p-6 text-sm opacity-70">Memeriksa sesi...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  return props.children;
}
