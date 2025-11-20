// src/components/fees/PeriodFilter.tsx
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type Period = { from?: string; to?: string };
type Props = {
  value: Period;
  onChange: (next: Period) => void;
  className?: string;
};

export default function PeriodFilter({ value, onChange, className }: Props): React.ReactElement {
  const idFrom = useId();
  const idTo = useId();

  // dialog state (internal) — supaya Cancel/Tutup tidak langsung mengubah value
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState<string>(value.from ?? "");
  const [draftTo, setDraftTo] = useState<string>(value.to ?? "");

  // sinkronkan ketika nilai dari luar berubah (mis. reset dari parent)
  useEffect(() => {
    setDraftFrom(value.from ?? "");
    setDraftTo(value.to ?? "");
  }, [value.from, value.to]);

  const summary = useMemo(() => {
    if (value.from && value.to) return `${value.from} — ${value.to}`;
    if (value.from) return `Dari ${value.from}`;
    if (value.to) return `Sampai ${value.to}`;
    return "Semua tanggal";
  }, [value.from, value.to]);

  const backdropRef = useRef<HTMLDivElement | null>(null);

  function apply(): void {
    onChange({
      from: draftFrom || undefined,
      to: draftTo || undefined,
    });
    setOpen(false);
  }

  function clearBoth(): void {
    setDraftFrom("");
    setDraftTo("");
    onChange({ from: undefined, to: undefined });
    setOpen(false);
  }

  function close(): void {
    // tutup tanpa menyimpan perubahan
    setDraftFrom(value.from ?? "");
    setDraftTo(value.to ?? "");
    setOpen(false);
  }

  // tutup ketika tekan Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className={className ?? ""}>
      {/* Trigger */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <button type="button" className="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
          Filter Periode
        </button>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{summary}</div>
      </div>

      {/* Dialog (portal-less, sederhana) */}
      {open && (
        <div
          ref={backdropRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${idFrom}-title`}
          onClick={(e) => {
            // klik backdrop untuk tutup
            if (e.target === backdropRef.current) close();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: 520 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h3 id={`${idFrom}-title`} style={{ margin: 0 }}>Pilih Periode</h3>
              <button type="button" className="button" onClick={close} aria-label="Tutup dialog">
                Tutup
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label htmlFor={idFrom}>Dari</label>
                <input
                  id={idFrom}
                  type="date"
                  className="input"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor={idTo}>Sampai</label>
                <input
                  id={idTo}
                  type="date"
                  className="input"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <button type="button" className="button" onClick={clearBoth}>
                Bersihkan
              </button>
              <div style={{ display: "inline-flex", gap: 8 }}>
                <button type="button" className="button" onClick={close}>
                  Batal
                </button>
                <button type="button" className="button button-primary" onClick={apply}>
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
