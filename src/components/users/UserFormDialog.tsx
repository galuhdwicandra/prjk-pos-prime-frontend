import React, { useEffect, useState } from "react";
import type { Role, User } from "../../types/user";

type Form = {
  name: string;
  email: string;
  phone: string;
  password: string;
  cabang_id: string; // string agar mudah handle kosong
  role: Role;
  is_active: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    payload: Omit<Form, "cabang_id" | "password"> & {
      cabang_id: number | null;
      password?: string;
    }
  ) => Promise<void>;
  editing?: User | null;
};

type SubmitPayload = {
  name: string;
  email: string;
  phone: string;
  cabang_id: number | null;
  role: Role;
  is_active: boolean;
  password?: string; // opsional saat edit
};

export default function UserFormDialog({ open, onClose, onSubmit, editing }: Props): React.ReactElement | null {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Form>({
    name: "",
    email: "",
    phone: "",
    password: "",
    cabang_id: "",
    role: "kasir",
    is_active: true,
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        email: editing.email,
        phone: editing.phone ?? "",
        password: "",
        cabang_id: editing.cabang_id ? String(editing.cabang_id) : "",
        role: editing.role,
        is_active: editing.is_active,
      });
    } else {
      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        cabang_id: "",
        role: "kasir",
        is_active: true,
      });
    }
  }, [editing, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const cab = form.cabang_id === "" ? null : Number(form.cabang_id);

      const payload: SubmitPayload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        cabang_id: cab,
        role: form.role,
        is_active: form.is_active,
      };

      if (form.password && form.password.trim().length > 0) {
        payload.password = form.password;
      }

      await onSubmit(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      // overlay sederhana (tanpa menambah index.css)
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="card" style={{ width: "100%", maxWidth: 640 }}>
        <div className="section" style={{ paddingBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
            <h3 style={{ margin: 0 }}>{editing ? "Edit User" : "Tambah User"}</h3>
            <button type="button" onClick={onClose} className="button">
              Tutup
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="section" style={{ paddingTop: "0.75rem" }}>
          {/* Grid form 2 kolom pada layar besar */}
          <div className="form-row form-row--2">
            <div className="form-field" style={{ gridColumn: "1 / -1" }}>
              <label>Nama</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                required
              />
            </div>

            <div className="form-field">
              <label>Telepon</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
              />
            </div>

            <div className="form-field">
              <label>Role</label>
              <select
                className="select"
                value={form.role}
                onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as Role }))}
              >
                <option value="superadmin">Superadmin</option>
                <option value="admin_cabang">Admin Cabang</option>
                <option value="gudang">Gudang</option>
                <option value="kasir">Kasir</option>
                <option value="sales">Sales</option>
                <option value="kurir">Kurir</option>
              </select>
            </div>

            <div className="form-field">
              <label>Cabang ID (opsional)</label>
              <input
                className="input"
                type="number"
                min={1}
                value={form.cabang_id}
                onChange={(e) => setForm((s) => ({ ...s, cabang_id: e.target.value }))}
              />
            </div>

            <div className="form-field">
              <label>Status</label>
              <select
                className="select"
                value={String(form.is_active)}
                onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.value === "true" }))}
              >
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>

            <div className="form-field" style={{ gridColumn: "1 / -1" }}>
              <label>{editing ? "Password (biarkan kosong jika tidak ganti)" : "Password"}</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                {...(editing ? {} : { required: true })}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: ".5rem", marginTop: ".5rem" }}>
            <button type="button" onClick={onClose} className="button">
              Batal
            </button>
            <button type="submit" disabled={submitting} className="button button-primary">
              {submitting ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
