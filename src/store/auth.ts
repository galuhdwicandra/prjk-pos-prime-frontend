// src/store/auth.ts
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { login as apiLogin, me as apiMe, logout as apiLogout } from "../api/auth";
import { getAuthToken, setAuthToken } from "../api/client";
import type { LoginPayload } from "../types/auth";
import type { Role, User } from "../types/user";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (...roles: Role[]) => boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider(props: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("idle");

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading" || status === "idle";

  const hasRole = useCallback(
    (...roles: Role[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const refreshMe = useCallback(async (): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }
    try {
      if (status === "idle") setStatus("loading");
      const u = await apiMe();
      setUser(u);
      setStatus("authenticated");
    } catch {
      setAuthToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, [status]);

  const login = useCallback(async (payload: LoginPayload): Promise<void> => {
    setStatus("loading");
    try {
      const res = await apiLogin(payload); // setAuthToken() sudah dipanggil di api/auth.ts
      setUser(res.user);
      setStatus("authenticated");
    } catch (e) {
      setAuthToken(null);
      setUser(null);
      setStatus("unauthenticated");
      throw e;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiLogout();
    } finally {
      setAuthToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshMe();
    })();
  }, [refreshMe]);

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      status,
      isLoading,
      isAuthenticated,
      hasRole,
      login,
      logout,
      refreshMe,
    }),
    [user, status, isLoading, isAuthenticated, hasRole, login, logout, refreshMe]
  );

  // TANPA JSX: pakai React.createElement agar file .ts valid
  return React.createElement(AuthContext.Provider, { value }, props.children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used within <AuthProvider />");
  return ctx;
}
