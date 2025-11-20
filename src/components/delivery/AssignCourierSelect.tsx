// src/components/delivery/AssignCourierSelect.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { ID } from "../../types/pos";
import type { User } from "../../types/user";
import type { Paginated } from "../../types/http";
import { listUsers } from "../../api/users";

type Props = {
  value: ID | null | undefined;
  onChange: (id: ID | null) => void;
  disabled?: boolean;
  allowAuto?: boolean; // tampilkan opsi "Auto-assign"
};

export default function AssignCourierSelect({
  value,
  onChange,
  disabled,
  allowAuto,
}: Props): React.ReactElement {
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Paginated<User> | null>(null);

  // debounce sederhana untuk pencarian
  const [debouncedQ, setDebouncedQ] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // load kurir by role, q, page
  useEffect(() => {
    let live = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await listUsers({
          role: "kurir", // pastikan Role union berisi "kurir"
          q: debouncedQ || undefined,
          per_page: perPage,
          page,
          is_active: true,
        });
        if (!live) return;
        setData(res);
      } catch (e) {
        if (!live) return;
        setError((e as { message?: string })?.message ?? "Gagal memuat kurir.");
      } finally {
        if (live) setLoading(false);
      }
    }
    run();
    return () => {
      live = false;
    };
  }, [debouncedQ, page, perPage]);

  // agar saat ganti query, kembali ke page 1
  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);

  const items = useMemo<User[]>(() => data?.data ?? [], [data]); // ← stable reference
  const meta = useMemo(
    () => data?.meta ?? { current_page: page, per_page: perPage, total: 0, last_page: 1 },
    [data, page, perPage]
  );

  const selectedLabel = useMemo(() => {
    const found = items.find((u) => u.id === value);
    return found?.name ?? (value ? `#${value}` : "");
  }, [items, value]);

  return (
    <div>
      {/* Bar pencarian + reset */}
      <div>
        <input
          className="input"
          placeholder="Cari kurir (nama/telepon)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
        />
        <button
          className="button"
          onClick={() => {
            setSearch("");
            setPage(1);
          }}
          disabled={disabled || (!search && page === 1)}
          title="Reset filter"
          type="button"
        >
          Reset
        </button>
      </div>

      {/* Select + pagination kecil */}
      <div>
        <select
          className="select"
          disabled={disabled || loading}
          value={value ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") return onChange(null);
            const n = Number(v);
            onChange(Number.isFinite(n) ? (n as ID) : null);
          }}
        >
          <option value="">{loading ? "Memuat kurir…" : selectedLabel || "Pilih kurir"}</option>
          {allowAuto && <option value="-1">Auto-assign (pilih otomatis)</option>}
          {items.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
              {u.phone ? ` — ${u.phone}` : ""}
            </option>
          ))}
        </select>

        <span>
          <small>
            {meta.current_page} / {meta.last_page}
          </small>
        </span>

        <button
          className="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={disabled || loading || (meta.current_page ?? 1) <= 1}
          title="Prev page"
          type="button"
        >
          ‹
        </button>
        <button
          className="button"
          onClick={() => setPage((p) => Math.min(meta.last_page ?? p + 1, p + 1))}
          disabled={disabled || loading || (meta.current_page ?? 1) >= (meta.last_page ?? 1)}
          title="Next page"
          type="button"
        >
          ›
        </button>
      </div>

      {/* Pesan status */}
      {error && (
        <div>
          <small>{error}</small>
        </div>
      )}
      {!error && !loading && items.length === 0 && (
        <div>
          <small>Tidak ada kurir untuk filter ini.</small>
        </div>
      )}
    </div>
  );
}
