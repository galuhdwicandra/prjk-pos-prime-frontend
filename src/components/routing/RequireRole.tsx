// src/components/routing/RequireRole.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../store/auth";
import type { Role } from "../../types/user";

function toSlug(x: string): string {
  return x.trim().toLowerCase().replace(/\s+/g, "_");
}

type MaybeRoleObject = { slug?: string; name?: string } | null | undefined;

/** Extract a single user role slug from either a string or {slug|name}. */
function getUserRoleSlug(userRole: string | MaybeRoleObject): string | null {
  if (typeof userRole === "string") return toSlug(userRole);
  if (userRole && typeof userRole === "object") {
    // Narrow safely: check keys existence at runtime
    if (typeof userRole.slug === "string" && userRole.slug) return toSlug(userRole.slug);
    if (typeof userRole.name === "string" && userRole.name) return toSlug(userRole.name);
  }
  return null;
}

export default function RequireRole(props: {
  roles: Role[];
  children: React.ReactElement;
}): React.ReactElement {
  const { isAuthenticated, status, user } = useAuth();
  const loc = useLocation();

  // Loading/auth bootstrap
  if (status === "idle" || status === "loading") {
    return <div className="p-6 text-sm opacity-70">Memeriksa akses...</div>;
  }

  // Not logged in → to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  // Normalize current user role -> slug
  const userSlug = getUserRoleSlug((user as unknown as { role?: string | MaybeRoleObject })?.role);
  const requiredSlugs = props.roles.map((r) => toSlug(String(r)));

  const allowed = !!userSlug && requiredSlugs.includes(userSlug);

  // Logged in but not allowed → to /dashboard
  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return props.children;
}
