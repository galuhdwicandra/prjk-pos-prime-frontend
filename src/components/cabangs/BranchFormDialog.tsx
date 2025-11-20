// src/components/cabangs/BranchFormDialog.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { Branch, BranchCreatePayload } from "../../types/branch";

type Props = {
  open: boolean;
  initial?: Branch | null;
  onClose: () => void;
  onSubmit: (payload: BranchCreatePayload) => Promise<boolean>;
};

const HARI = [
  { v: "Senin–Jumat", label: "Senin–Jumat" },
  { v: "Senin–Sabtu", label: "Senin–Sabtu" },
  { v: "Senin–Minggu", label: "Senin–Minggu" },
] as const;

function parseJamOperasional(input?: string | null): { hari: string; openAt: string; closeAt: string } | null {
  if (!input) return null;
  // Pola: "Senin–Minggu 08:00-21:00"
  const m = input.match(/^(.+?)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
  if (!m) return null;
  const [, hari, openAt, closeAt] = m;
  return { hari, openAt, closeAt };
}

export default function BranchFormDialog({ open, initial, onClose, onSubmit }: Props): React.ReactElement | null {
  const [form, setForm] = useState<BranchCreatePayload>({
    nama: "",
    kota: "",
    alamat: "",
    telepon: "",
    jam_operasional: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State builder jam operasional
  const [hari, setHari] = useState<string>("Senin–Minggu");
  const [openAt, setOpenAt] = useState<string>("08:00");
  const [closeAt, setCloseAt] = useState<string>("21:00");

  // Gabungkan builder -> form.jam_operasional
  useEffect(() => {
    setForm((s) => ({ ...s, jam_operasional: `${hari} ${openAt}-${closeAt}` }));
  }, [hari, openAt, closeAt]);

  // Inisialisasi saat dialog dibuka (create/edit)
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        nama: initial.nama,
        kota: initial.kota,
        alamat: initial.alamat,
        telepon: initial.telepon ?? "",
        jam_operasional: initial.jam_operasional ?? "",
        is_active: initial.is_active,
      });

      // Kalau nilai existing bisa di-parse, sinkronkan ke picker
      const parsed = parseJamOperasional(initial.jam_operasional);
      if (parsed) {
        setHari(parsed.hari);
        setOpenAt(parsed.openAt);
        setCloseAt(parsed.closeAt);
      } else {
        // fallback default jika format lama bebas
        setHari("Senin–Minggu");
        setOpenAt("08:00");
        setCloseAt("21:00");
      }
    } else {
      // mode tambah
      setForm({
        nama: "",
        kota: "",
        alamat: "",
        telepon: "",
        jam_operasional: "Senin–Minggu 08:00-21:00",
        is_active: true,
      });
      setHari("Senin–Minggu");
      setOpenAt("08:00");
      setCloseAt("21:00");
    }
    setError(null);
  }, [open, initial]);

  const valid = useMemo(() => {
    // validasi ringan: nama/kota/alamat wajib, jam buka < jam tutup
    if (!form.nama?.trim()) return false;
    if (!form.kota?.trim()) return false;
    if (!form.alamat?.trim()) return false;
    if (!/^\d{2}:\d{2}$/.test(openAt) || !/^\d{2}:\d{2}$/.test(closeAt)) return false;
    return openAt < closeAt; // string compare works for HH:MM
  }, [form.nama, form.kota, form.alamat, openAt, closeAt]);

  if (!open) return null;

  const submit = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      if (!valid) {
        setSaving(false);
        setError("Form belum valid. Pastikan nama/kota/alamat terisi dan jam buka < jam tutup.");
        return;
      }
      const ok = await onSubmit(form);
      setSaving(false);
      if (ok) onClose();
      else setError("Gagal menyimpan. Cek input.");
    } catch {
      setSaving(false);
      setError("Terjadi kesalahan saat menyimpan.");
    }
  };

  return (
    <div
      // Backdrop modal
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
      aria-modal
      role="dialog"
    >
      <div className="card" style={{ width: "100%", maxWidth: 640 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 className="h3" style={{ margin: 0 }}>
            {initial ? "Edit Cabang" : "Tambah Cabang"}
          </h3>
          <button className="button button-outline" onClick={onClose} disabled={saving}>
            Tutup
          </button>
        </div>

        {/* Form fields */}
        <div className="form-row form-row--2" style={{ marginTop: 8 }}>
          <input
            className="input"
            placeholder="Nama"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
          />
          <input
            className="input"
            placeholder="Kota"
            value={form.kota}
            onChange={(e) => setForm({ ...form, kota: e.target.value })}
          />

          <input
            className="input"
            placeholder="Alamat"
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
            style={{ gridColumn: "1 / -1" }}
          />

          <input
            className="input"
            placeholder="Telepon"
            value={form.telepon ?? ""}
            onChange={(e) => setForm({ ...form, telepon: e.target.value })}
          />
        </div>

        {/* Builder Jam Operasional */}
        <div className="form-row form-row--3" style={{ marginTop: 8 }}>
          <div>
            <label className="label">Hari</label>
            <select className="select" value={hari} onChange={(e) => setHari(e.target.value)}>
              {HARI.map((h) => (
                <option key={h.v} value={h.v}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Buka</label>
            <input
              type="time"
              className="input"
              value={openAt}
              onChange={(e) => setOpenAt(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Tutup</label>
            <input
              type="time"
              className="input"
              value={closeAt}
              onChange={(e) => setCloseAt(e.target.value)}
            />
          </div>

          <div style={{ gridColumn: "1 / -1", fontSize: 12, opacity: 0.75 }}>
            Tersimpan sebagai: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
              {form.jam_operasional || "-"}
            </span>
          </div>
        </div>

        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input
            type="checkbox"
            checked={Boolean(form.is_active)}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Aktif
        </label>

        {/* Error */}
        {error && (
          <div className="card" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <span className="badge badge-danger">Error</span>
            <span style={{ fontSize: 14 }}>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button className="button button-outline" onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button className="button button-primary" onClick={submit} disabled={saving || !valid}>
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
