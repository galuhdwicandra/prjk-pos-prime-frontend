// src/components/delivery/DamageClaimDialog.tsx
import React, { useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { note?: string | null; file?: File | null }) => Promise<void>;
};

export default function DamageClaimDialog({ open, onClose, onSubmit }: Props): React.ReactElement | null {
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  async function submit(): Promise<void> {
    setSubmitting(true);
    try {
      await onSubmit({ note: note || null, file: fileRef.current?.files?.[0] ?? null });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="damage-claim-title"
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
    >
      <div className="card" style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ marginBottom: 8 }}>
          <h3 id="damage-claim-title" style={{ margin: 0 }}>Ajukan Klaim Kerusakan</h3>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label htmlFor="claim-note" style={{ display: "block", fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
              Catatan (opsional)
            </label>
            <textarea
              id="claim-note"
              className="textarea"
              placeholder="Catatan singkat…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="claim-file" style={{ display: "block", fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
              Foto bukti (opsional)
            </label>
            <input
              id="claim-file"
              ref={fileRef}
              type="file"
              accept="image/*"
              className="input"
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button className="button button-outline" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button className="button button-primary" onClick={submit} disabled={submitting}>
            {submitting ? "Mengirim…" : "Kirim"}
          </button>
        </div>
      </div>
    </div>
  );
}
