// src/components/warehouses/WarehouseFormDialog.tsx
import React, { useEffect, useState } from "react";
import type { Warehouse, WarehouseCreatePayload } from "../../types/warehouse";
import { useAuth } from "../../store/auth";
import { listBranches } from "../../api/branches";

type Props = {
  open: boolean;
  initial?: Warehouse | null;
  defaultCabangId?: number;
  onClose: () => void;
  onSubmit: (payload: WarehouseCreatePayload) => Promise<boolean>;
};

export default function WarehouseFormDialog({
  open,
  initial,
  defaultCabangId,
  onClose,
  onSubmit,
}: Props): React.ReactElement | null {
  const [form, setForm] = useState<WarehouseCreatePayload>({
    cabang_id: defaultCabangId ?? 0,
    nama: "",
    is_default: false,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const lockCabang = user?.role === "admin_cabang" && user.cabang_id;

  const [cabangs, setCabangs] = useState<{ id: number; nama: string }[]>([]);

  // load cabang saat dialog dibuka
  useEffect(() => {
    if (!open) return;
    void (async () => {
      const res = await listBranches({ is_active: true, per_page: 100 });
      setCabangs(res.data.map((b) => ({ id: b.id, nama: b.nama })));
    })();
  }, [open]);

  // set preferensi cabang saat tambah (bukan edit)
  useEffect(() => {
    if (!open || initial) return;
    const prefer = (lockCabang as number) ?? (defaultCabangId ?? 0);
    setForm((s) => ({ ...s, cabang_id: prefer }));
  }, [open, initial, lockCabang, defaultCabangId]);

  // isi form saat edit
  useEffect(() => {
    if (!open || !initial) return;
    setForm({
      cabang_id: initial.cabang_id,
      nama: initial.nama,
      is_default: Boolean(initial.is_default),
      is_active: Boolean(initial.is_active),
    });
  }, [open, initial]);

  if (!open) return null;

  const submit = async () => {
    setSaving(true);
    setError(null);
    if (!form.cabang_id) {
      setError("Cabang harus diisi.");
      setSaving(false);
      return;
    }
    const ok = await onSubmit(form);
    setSaving(false);
    if (ok) onClose();
    else setError("Gagal menyimpan. Cek input.");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="warehouse-dialog-title"
      // backdrop & center tanpa menambah kelas baru (hanya inline style)
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 640 }}>
        <h3 id="warehouse-dialog-title" className="card-title" style={{ marginBottom: 8 }}>
          {initial ? "Edit Gudang" : "Tambah Gudang"}
        </h3>

        {/* form grid bawaan index.css */}
        <div className="form-row form-row--2" style={{ marginTop: 12 }}>
          <div>
            <label className="label">Cabang</label>
            <select
              className="select"
              value={form.cabang_id || ""}
              onChange={(e) => setForm({ ...form, cabang_id: Number(e.target.value) })}
              disabled={Boolean(lockCabang)}
            >
              <option value="" disabled>
                Pilih Cabang
              </option>
              {cabangs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Nama Gudang</label>
            <input
              className="input"
              placeholder="Nama Gudang"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={Boolean(form.is_default)}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
            />
            Default
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={Boolean(form.is_active)}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Aktif
          </label>
        </div>

        {error && (
          <div className="muted" style={{ marginTop: 8 }}>
            <span className="badge badge-danger" style={{ marginRight: 8 }}>
              Error
            </span>
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button className="button" onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button className="button button-primary" onClick={submit} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
