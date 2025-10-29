// AccountingAccountsIndex.tsx
import { useState } from "react";
import AccountTable from "../../components/accounting/AccountTable";
import type { Account, AccountCreatePayload } from "../../types/accounting";
import { createAccount, updateAccount, deleteAccount } from "../../api/accounting";
import { useAuth } from "../../store/auth";

export default function AccountingAccountsIndex() {
  const { hasRole } = useAuth();
  const canWrite = hasRole("superadmin", "admin_cabang");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(payload: AccountCreatePayload) {
    try {
      setErr(null);
      if (editing) {
        await updateAccount(editing.id, payload);
      } else {
        await createAccount(payload);
      }
      setDialogOpen(false);
      setEditing(null);
      setToast("Akun tersimpan.");
    } catch {
      setErr("Gagal menyimpan akun (cek 422/403).");
    }
  }

  async function onDelete(a: Account) {
    if (!confirm(`Hapus akun ${a.code} - ${a.name}?`)) return;
    try {
      await deleteAccount(a.id);
      setToast("Akun dihapus.");
    } catch {
      setErr("Gagal menghapus akun.");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>Chart of Accounts</h1>
          <div style={{ marginLeft: "auto" }} />
          <button
            className="button button-primary"
            onClick={() => { setEditing(null); setDialogOpen(true); }}
            disabled={!canWrite}
            aria-disabled={!canWrite}
            title={canWrite ? "Tambah akun" : "Hanya-baca"}
          >
            Akun Baru
          </button>
        </div>
      </div>

      {/* Toasts */}
      {toast && (
        <div
          className="toast"
          style={{ marginBottom: 12, borderLeftColor: "var(--color-success)" }}
          role="status"
        >
          {toast}
        </div>
      )}
      {err && (
        <div
          className="toast"
          style={{ marginBottom: 12, borderLeftColor: "var(--color-danger)" }}
          role="alert"
        >
          {err}
        </div>
      )}

      {/* Tabel akun */}
      <div className="card" style={{ marginBottom: 12 }}>
        <AccountTable
          onEdit={(a) => { if (!canWrite) return; setEditing(a); setDialogOpen(true); }}
          onDelete={onDelete}
        />
      </div>

      {/* Dialog (popup) */}
      {dialogOpen && (
        <Dialog onClose={() => setDialogOpen(false)} title={editing ? "Edit Akun" : "Akun Baru"}>
          <AccountFormMini
            initial={{
              cabang_id: editing?.cabang_id ?? null,
              code: editing?.code ?? "",
              name: editing?.name ?? "",
              type: editing?.type ?? "Asset",
              normal_balance: editing?.normal_balance ?? "DEBIT",
              parent_id: editing?.parent_id ?? null,
              is_active: editing?.is_active ?? true,
            }}
            onCancel={() => setDialogOpen(false)}
            onSave={onSubmit}
          />
        </Dialog>
      )}
    </div>
  );
}

/** Dialog popup — tanpa menambah class baru di index.css;
 *  backdrop & posisi pakai inline style minimal, konten tetap .card agar konsisten.
 */
function Dialog(props: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={props.title}
      onClick={(e) => {
        // klik backdrop menutup dialog
        if (e.target === e.currentTarget) props.onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 50,
      }}
    >
      <div
        className="card"
        style={{
          width: "min(560px, 92vw)",
          maxHeight: "86vh",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: "1rem" }}>{props.title}</div>
          <div style={{ marginLeft: "auto" }} />
          <button className="button" onClick={props.onClose} aria-label="Tutup dialog">
            Tutup
          </button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

function AccountFormMini(props: {
  initial: AccountCreatePayload & { parent_id: number | null; normal_balance: "DEBIT" | "CREDIT" };
  onSave: (p: AccountCreatePayload) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(props.initial);

  return (
    <form onSubmit={(e) => { e.preventDefault(); props.onSave(form); }}>
      {/* Grid form 2 kolom (class ada di index.css) */}
      <div className="form-row form-row--2">
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Kode</label>
          <input
            className="input"
            placeholder="Kode"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Nama</label>
          <input
            className="input"
            placeholder="Nama"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Tipe Akun</label>
          <select
            className="select"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
          >
            <option>Asset</option>
            <option>Liability</option>
            <option>Equity</option>
            <option>Revenue</option>
            <option>Expense</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Normal Balance</label>
          <select
            className="select"
            value={form.normal_balance}
            onChange={(e) => setForm({ ...form, normal_balance: e.target.value as typeof form.normal_balance })}
          >
            <option>DEBIT</option>
            <option>CREDIT</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Cabang ID (opsional)</label>
          <input
            className="input"
            placeholder="Kosongkan jika global"
            value={form.cabang_id ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                cabang_id: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            type="number"
            min={1}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Parent ID (opsional)</label>
          <input
            className="input"
            placeholder="Parent ID"
            value={form.parent_id ?? ""}
            onChange={(e) => setForm({ ...form, parent_id: e.target.value ? Number(e.target.value) : null })}
            type="number"
            min={0}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            id="is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          <label htmlFor="is_active" style={{ fontWeight: 600 }}>Aktif</label>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="submit" className="button button-primary">Simpan</button>
        <button type="button" className="button" onClick={props.onCancel}>Batal</button>
      </div>
    </form>
  );
}
