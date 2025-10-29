// src/components/stock/SetInitialStockDialog.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import CabangSelect from "./CabangSelect";
import GudangSelect from "./GudangSelect";
import VariantPicker from "./VariantPicker";
import { setInitialStock } from "../../api/stocks";

type Props = { open: boolean; onClose: () => void; onSuccess: () => void };

function getErrorMessage(err: unknown, fallback = "Terjadi kesalahan."): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const maybe = (err as { message?: unknown }).message;
    if (typeof maybe === "string") return maybe;
  }
  return fallback;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Robust parser untuk berbagai bentuk nilai (number/string/object) tanpa `any` */
function parseId(v: unknown): number | undefined {
  if (v == null) return undefined;

  if (typeof v === "number") {
    return Number.isFinite(v) && v > 0 ? v : undefined;
  }

  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }

  if (isRecord(v)) {
    const candidates = [
      "id",
      "value",
      "gudang_id",
      "gudangId",
      "cabang_id",
      "cabangId",
      "product_variant_id",
      "variantId",
    ];
    for (const key of candidates) {
      if (key in v) {
        const raw = (v as Record<string, unknown>)[key];
        if (typeof raw === "number") {
          if (Number.isFinite(raw) && raw > 0) return raw;
        } else if (typeof raw === "string") {
          const n = Number(raw);
          if (Number.isFinite(n) && n > 0) return n;
        }
      }
    }
  }

  return undefined;
}

export default function SetInitialStockDialog({ open, onClose, onSuccess }: Props) {
  const [cabangId, setCabangId] = useState<number | undefined>();
  const [gudangId, setGudangId] = useState<number | undefined>();
  const [variantId, setVariantId] = useState<number | undefined>();
  const [qty, setQty] = useState<number>(0);
  const [minStok, setMinStok] = useState<number | undefined>(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setGudangId(undefined);
    setVariantId(undefined);
    setQty(0);
    setMinStok(10);
  }, [open]);

  useEffect(() => {
    setGudangId(undefined);
  }, [cabangId]);

  const onCabangChange = (raw: unknown) => setCabangId(parseId(raw));
  const onGudangChange = (raw: unknown) => setGudangId(parseId(raw));
  const onVariantChange = (raw: unknown) => setVariantId(parseId(raw));

  const onQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const n = raw === "" ? 0 : Number(raw);
    setQty(n);
  };

  const onMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const n = raw === "" ? 0 : Number(raw);
    setMinStok(n);
  };

  const valid = useMemo(() => {
    const gidOk = Number.isFinite(gudangId) && Number(gudangId) > 0;
    const vidOk = Number.isFinite(variantId) && Number(variantId) > 0;
    const qtyOk = Number.isFinite(qty) && qty >= 0;
    return gidOk && vidOk && qtyOk;
  }, [gudangId, variantId, qty]);

  const disabledReason = useMemo(() => {
    const reasons: string[] = [];
    if (!(Number.isFinite(gudangId) && Number(gudangId) > 0)) reasons.push("Gudang belum dipilih (ID > 0).");
    if (!(Number.isFinite(variantId) && Number(variantId) > 0)) reasons.push("Varian belum dipilih (ID > 0).");
    if (!(Number.isFinite(qty) && qty >= 0)) reasons.push("Qty tidak valid (>= 0).");
    return reasons.join(" ");
  }, [gudangId, variantId, qty]);

  const handleSubmit = useCallback(async () => {
    if (!valid) return;

    const gid = Number(gudangId);
    const vid = Number(variantId);
    const q = Number(qty);
    const m = minStok != null ? Number(minStok) : undefined;

    if (!Number.isFinite(gid) || gid <= 0) return;
    if (!Number.isFinite(vid) || vid <= 0) return;
    if (!Number.isFinite(q) || q < 0) return;

    setSaving(true);
    try {
      await setInitialStock({
        gudang_id: gid,
        product_variant_id: vid,
        qty: q,
        min_stok: m,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Gagal set stok awal.");
      alert(msg);
    } finally {
      setSaving(false);
    }
  }, [valid, gudangId, variantId, qty, minStok, onSuccess, onClose]);

  if (!open) return null;

  return (
    // Backdrop (inline style agar tidak menambah kelas di index.css)
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000,
      }}
    >
      <form
        className="card"
        style={{ width: "100%", maxWidth: 560 }}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        data-testid="set-initial-stock-form"
      >
        <h3 style={{ marginBottom: 12 }}>Set Stok Awal</h3>

        {/* Baris 1: Cabang, Gudang */}
        <div className="form-row form-row--2" style={{ marginBottom: 12 }}>
          <label>
            <div className="label">Cabang</div>
            <CabangSelect value={cabangId} onChange={onCabangChange} />
          </label>

          <label>
            <div className="label">Gudang</div>
            <GudangSelect cabangId={cabangId} value={gudangId} onChange={onGudangChange} />
          </label>
        </div>

        {/* Baris 2: Varian (full width) */}
        <div style={{ marginBottom: 12 }}>
          <label>
            <div className="label">Varian Produk</div>
            <VariantPicker value={variantId} onChange={onVariantChange} />
          </label>
        </div>

        {/* Baris 3: Qty & Min Stok */}
        <div className="form-row form-row--2" style={{ marginBottom: 16 }}>
          <label>
            <div className="label">Qty</div>
            <input
              type="number"
              min={0}
              className="input"
              value={Number.isFinite(qty) ? qty : 0}
              onChange={onQtyChange}
              required
            />
          </label>

          <label>
            <div className="label">Min. Stok</div>
            <input
              type="number"
              min={0}
              className="input"
              value={minStok ?? 0}
              onChange={onMinChange}
            />
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            className="button"
            onClick={onClose}
            disabled={saving}
          >
            Batal
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={!valid || saving}
            title={!valid ? (disabledReason || "Lengkapi Cabang, Gudang, Varian, dan Qty ≥ 0") : ""}
          >
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
