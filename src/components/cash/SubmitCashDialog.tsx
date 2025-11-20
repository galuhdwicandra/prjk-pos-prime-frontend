// src/components/cash/SubmitCashDialog.tsx
import React, { useEffect, useMemo, useState } from "react";
import { listCashHolders, submitCash } from "../../api/cash";
import type { CashHolder, SubmitCashPayload } from "../../types/cash";

function todayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function simpleKey(): string {
  // lightweight, <=64 chars as per backend rule
  return `${Math.random().toString(36).slice(2)}.${Date.now().toString(36)}`;
}

type Props = {
  open: boolean;
  defaultFrom?: CashHolder | null;
  onClose: () => void;
  onSubmitted?: (id: number) => void; // give new move id for history refresh
};

export default function SubmitCashDialog({
  open,
  onClose,
  defaultFrom,
  onSubmitted,
}: Props): React.ReactElement | null {
  const [holders, setHolders] = useState<CashHolder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SubmitCashPayload>({
    from_holder_id: defaultFrom?.id ?? 0,
    to_holder_id: 0,
    amount: 0,
    note: "",
    moved_at: todayYMD(),
    idempotency_key: simpleKey(),
  });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setForm((s) => ({
      ...s,
      moved_at: todayYMD(),
      idempotency_key: simpleKey(),
    }));
    listCashHolders({ per_page: 50 })
      .then((res) => setHolders(res.data))
      .catch((e: unknown) =>
        setError((e as { message?: string }).message ?? "Gagal memuat holder.")
      )
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setForm((s) => ({
      ...s,
      from_holder_id: defaultFrom?.id ?? s.from_holder_id,
    }));
  }, [defaultFrom, open]);

  const canSubmit = useMemo(() => {
    const validAmount = Number.isFinite(form.amount) && form.amount > 0;
    return (
      !loading &&
      !saving &&
      form.from_holder_id > 0 &&
      form.to_holder_id > 0 &&
      form.from_holder_id !== form.to_holder_id &&
      validAmount &&
      !!form.moved_at
    );
  }, [form, loading, saving]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-cash-title"
      // Backdrop + center (inline style supaya tidak menambah rules di index.css)
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={onClose}
    >
      {/* stopClose saat klik isi dialog */}
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 640,
          background: "#fff",
          cursor: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="card__header">
          <h2 id="submit-cash-title" className="card__title">
            Ajukan Setoran Tunai
          </h2>
        </div>

        {/* Body */}
        <div className="card__body">
          {loading && <div className="text-muted">Memuat daftar holder…</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Form fields */}
          <div className="form-row form-row--2">
            <div className="form-field">
              <label className="form-label">Dari Holder</label>
              <select
                value={form.from_holder_id}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    from_holder_id: Number(e.target.value),
                  }))
                }
                className="select"
              >
                <option value={0}>Pilih…</option>
                {holders.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Ke Holder</label>
              <select
                value={form.to_holder_id}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    to_holder_id: Number(e.target.value),
                  }))
                }
                className="select"
              >
                <option value={0}>Pilih…</option>
                {holders.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row form-row--2">
            <div className="form-field">
              <label className="form-label">Jumlah</label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={form.amount}
                onChange={(e) =>
                  setForm((s) => ({ ...s, amount: Number(e.target.value) }))
                }
                className="input"
                placeholder="0"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Tanggal Setoran</label>
              <input
                type="date"
                value={form.moved_at}
                onChange={(e) =>
                  setForm((s) => ({ ...s, moved_at: e.target.value }))
                }
                className="input"
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Catatan (opsional)</label>
            <textarea
              value={form.note ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
              className="textarea"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="card__footer" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} className="button button-outline">
            Batal
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={async () => {
              setSaving(true);
              setError(null);
              try {
                const res = await submitCash(form);
                onSubmitted?.(res.data.id);
                onClose();
              } catch (e) {
                const err = e as {
                  response?: { data?: { message?: string; errors?: Record<string, string[]> } };
                };
                const serverMsg = err.response?.data?.message;
                const firstFieldError = err.response?.data?.errors
                  ? Object.values(err.response.data.errors)[0]?.[0]
                  : undefined;
                setError(serverMsg ?? firstFieldError ?? "Gagal mengajukan setoran.");
              } finally {
                setSaving(false);
              }
            }}
            className="button button-primary"
            aria-busy={saving ? "true" : "false"}
          >
            {saving ? "Menyimpan…" : "Kirim"}
          </button>
        </div>
      </div>
    </div>
  );
}
