import { useEffect, useRef, useState } from "react";
import { listCustomers } from "../../api/customers";
import type { Customer } from "../../types/customers";

type Props = {
    branchId: number | string;
    value: Customer | null;
    onChange: (c: Customer | null) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

/**
 * CustomerSelect
 * Autocomplete pelanggan terdaftar berdasarkan cabang.
 * - Ketik nama / no HP => fetch 10 teratas
 * - Klik salah satu => onChange(Customer)
 * - Nilai terpilih ditampilkan sebagai "Nama (No HP)"
 */
export default function CustomerSelect({
    branchId,
    value,
    onChange,
    placeholder = "Cari nama / no HP terdaftar…",
    disabled = false,
    className = "",
}: Props) {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timer = useRef<number | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    // tutup dropdown saat klik di luar
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!wrapRef.current) return;
            if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    // fetch dengan debounce ketika q berubah
    useEffect(() => {
        if (!q) {
            setRows([]);
            setLoading(false);
            setError(null);
            return;
        }
        setLoading(true);
        setError(null);
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(async () => {
            try {
                const res = await listCustomers({
                    q,
                    cabang_id: branchId,
                    per_page: 10,
                    page: 1,
                });
                // asumsikan respons { data: Customer[] }
                setRows(res.data ?? []);
            } catch (err: any) {
                setError(err?.message ?? "Gagal memuat pelanggan");
            } finally {
                setLoading(false);
            }
        }, 250);
        return () => {
            if (timer.current) window.clearTimeout(timer.current);
        };
    }, [q, branchId]);

    const displayText =
        value ? `${value.nama ?? "-"}${value.phone ? ` (${value.phone})` : ""}` : q;

    return (
        <div ref={wrapRef} className={`relative ${className}`}>
            <input
                className="input w-full"
                placeholder={placeholder}
                value={displayText}
                onChange={(e) => {
                    setQ(e.target.value);
                    onChange(null);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                disabled={disabled}
            />

            {open && (
                <div
                    className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-white shadow"
                    role="listbox"
                >
                    {loading && (
                        <div className="px-3 py-2 text-sm text-gray-500">Memuat…</div>
                    )}
                    {error && (
                        <div className="px-3 py-2 text-sm text-red-600">{error}</div>
                    )}
                    {!loading && !error && rows.length === 0 && q && (
                        <div className="px-3 py-2 text-sm text-gray-500">
                            Tidak ada hasil untuk “{q}”
                        </div>
                    )}
                    {!loading &&
                        !error &&
                        rows.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                className="flex w-full cursor-pointer flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-gray-100"
                                onMouseDown={(e) => e.preventDefault()} // agar input tidak blur sebelum click
                                onClick={() => {
                                    onChange(c);
                                    setOpen(false);
                                    setQ("");
                                }}
                            >
                                <span className="text-sm font-medium">
                                    {c.nama ?? "(tanpa nama)"}
                                </span>
                                <span className="text-xs text-gray-600">
                                    {c.phone ?? "-"} • {c.alamat ?? "-"}
                                </span>
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}
