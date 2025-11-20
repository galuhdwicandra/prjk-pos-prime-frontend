// src/components/stock/CabangSelect.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { Branch, BranchQuery } from "../../types/branch";
import { listBranches } from "../../api/branches";
import { useAuth } from "../../store/auth";

type Props = {
  value?: number; // selected cabang_id (controlled by parent)
  onChange: (id: number | undefined) => void;
  disabled?: boolean;
  allowAll?: boolean; // show “Semua Cabang” option when not locked
};

export default function CabangSelect({ value, onChange, disabled, allowAll }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // Determine if user is locked to a cabang (admin_cabang / gudang)
  const lockedCabangId = useMemo<number | undefined>(() => {
    if (!user) return undefined;
    const role = user.role;
    if ((role === "admin_cabang" || role === "gudang") && user.cabang_id != null) {
      return user.cabang_id;
    }
    return undefined;
  }, [user]);

  // Fetch list of active branches (once)
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    const q: BranchQuery = { is_active: true, per_page: 100 };
    listBranches(q)
      .then((res) => {
        if (!alive) return;
        setRows(res.data ?? []);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        const msg =
          typeof e === "object" && e !== null && "message" in e && typeof (e as { message?: unknown }).message === "string"
            ? String((e as { message?: unknown }).message)
            : "Gagal memuat cabang.";
        setError(msg);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => { alive = false; };
  }, []);

  // If locked, ensure parent value matches lock, but emit only when it actually differs (once)
  const lastEmittedRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (lockedCabangId == null) return;
    if (value === lockedCabangId) return;
    if (lastEmittedRef.current === lockedCabangId) return;

    lastEmittedRef.current = lockedCabangId;
    onChange(lockedCabangId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedCabangId, value]);

  // Stable, nicely sorted options
  const options = useMemo(() => {
    const sorted = [...rows].sort((a, b) => a.nama.localeCompare(b.nama, "id"));
    return sorted;
  }, [rows]);

  // Compute the current value for the <select>
  const selectedValue: number | "" = lockedCabangId != null ? lockedCabangId : (value ?? "");

  // Disable when locked or loading or externally disabled
  const isDisabled = Boolean(disabled || loading || lockedCabangId != null);

  return (
    <>
      <select
        className="select"
        value={selectedValue}
        disabled={isDisabled}
        aria-label="Pilih Cabang"
        aria-busy={loading}
        onChange={(e) => {
          const v = e.target.value;
          const next = v === "" ? undefined : Number(v);
          if (next === value) return;
          onChange(next);
        }}
      >
        {/* “Semua Cabang” only when not locked */}
        {allowAll && lockedCabangId == null && (
          <option value="">Semua Cabang</option>
        )}

        {/* Loading placeholder */}
        {loading && (
          <option value="" disabled>
            Memuat cabang…
          </option>
        )}

        {/* If locked, show only the locked cabang */}
        {lockedCabangId != null
          ? options
              .filter((r) => r.id === lockedCabangId)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama}{r.kota ? ` · ${r.kota}` : ""}
                </option>
              ))
          : options.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nama}{r.kota ? ` · ${r.kota}` : ""}
              </option>
            ))}
      </select>

      {error && (
        <div className="mt-2">
          <span className="badge badge-danger">Error</span>
          <span style={{ marginLeft: 8 }}>{error}</span>
        </div>
      )}
    </>
  );
}
