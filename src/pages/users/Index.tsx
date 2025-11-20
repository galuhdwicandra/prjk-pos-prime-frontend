import React, { useCallback, useEffect, useMemo, useState } from "react";
import { listUsers, createUser, updateUser, deleteUser } from "../../api/users";
import type { Paginated } from "../../types/http";
import type { Role, User } from "../../types/user";
import { useAuth } from "../../store/auth";
import UserFilters from "../../components/users/UserFilters";
import UserTable from "../../components/users/UserTable";
import UserFormDialog from "../../components/users/UserFormDialog";

export default function UsersIndex(): React.ReactElement {
  const { hasRole } = useAuth();
  const canManage = hasRole("superadmin", "admin_cabang");

  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [cabangId, setCabangId] = useState<number | "">("");
  const [isActive, setIsActive] = useState<"" | "1" | "0">("");

  const [data, setData] = useState<Paginated<User> | null>(null);
  const [loading, setLoading] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const params = useMemo(() => ({
    q: q || undefined,
    role: (role || undefined) as Role | undefined,
    cabang_id: (cabangId === "" ? undefined : cabangId) as number | undefined,
    is_active: isActive === "" ? undefined : (isActive === "1"),
    per_page: 10,
    page,
  }), [q, role, cabangId, isActive, page]);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await listUsers(params);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function handleFilterChange(next: Partial<{ q: string; role: Role | ""; cabangId: number | ""; isActive: "" | "1" | "0" }>): void {
    if ("q" in next) setQ(next.q ?? "");
    if ("role" in next) setRole((next.role ?? "") as Role | "");
    if ("cabangId" in next) setCabangId((next.cabangId ?? "") as number | "");
    if ("isActive" in next) setIsActive((next.isActive ?? "") as "" | "1" | "0");
  }

  function resetFilters(): void {
    setQ(""); setRole(""); setCabangId(""); setIsActive(""); setPage(1);
  }

  async function submitCreate(payload: Parameters<typeof createUser>[0]): Promise<void> {
    await createUser(payload);
    await fetchData();
  }

  async function submitUpdate(payload: Parameters<typeof updateUser>[1]): Promise<void> {
    if (!editing) return;
    await updateUser(editing.id, payload);
    setEditing(null);
    await fetchData();
  }

  async function confirmDelete(u: User): Promise<void> {
    if (!canManage) return;
    const ok = window.confirm(`Hapus user "${u.name}"? Tindakan ini tidak bisa dibatalkan.`);
    if (!ok) return;
    await deleteUser(u.id);
    await fetchData();
  }

  return (
    <div className="container">
      {/* Header */}
      <section className="section">
        <h1>Users</h1>
        <p className="mb-3" style={{ opacity: 0.8 }}>Kelola pengguna & akses cabang.</p>
      </section>

      {/* Filter Card */}
      <div className="card mb-3">
        <UserFilters
          q={q}
          role={role}
          cabangId={cabangId}
          isActive={isActive}
          onChange={handleFilterChange}
          onReset={resetFilters}
          onSearch={() => setPage(1)}
        />
      </div>

      {/* Toolbar atas tabel */}
      <div className="section" style={{ marginTop: 0, paddingTop: 0 }}>
        <div>
          <span style={{ opacity: 0.8, fontSize: ".9rem" }}>
            Search
          </span>
          {canManage && (
            <button
              onClick={() => { setEditing(null); setOpenForm(true); }}
              className="button button-primary"
              style={{ float: "right" }}
            >
              Tambah User
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <UserTable
          data={data}
          loading={loading}
          onEdit={(u) => { if (canManage) { setEditing(u); setOpenForm(true); } }}
          onDelete={confirmDelete}
          page={page}
          onPage={setPage}
        />
      </div>

      {/* Dialog */}
      {openForm && (
        <UserFormDialog
          open={openForm}
          onClose={() => { setOpenForm(false); }}
          editing={editing ?? undefined}
          onSubmit={async (p) => {
            if (editing) {
              // UPDATE — password opsional
              const { password, ...rest } = p;
              const updatePayload =
                password && password.trim().length > 0
                  ? { ...rest, password }
                  : rest;
              await submitUpdate(updatePayload);
            } else {
              // CREATE — password wajib string
              if (!p.password || p.password.trim().length === 0) {
                throw new Error("Password wajib diisi untuk user baru.");
              }
              const createPayload = {
                name: p.name,
                email: p.email,
                phone: p.phone || null,
                password: p.password,
                cabang_id: p.cabang_id ?? null,
                role: p.role,
                is_active: p.is_active,
              };
              await submitCreate(createPayload);
            }
          }}
        />
      )}
    </div>
  );
}
