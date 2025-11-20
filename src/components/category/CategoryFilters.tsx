import { useEffect, useState } from "react";
import type { CategoryQuery, SortCategory } from "../../types/category";

type Props = {
  value: CategoryQuery;
  onChange: (next: CategoryQuery) => void;
};

const SORT_OPTIONS: { label: string; value: SortCategory }[] = [
  { label: "Nama A→Z", value: "nama" },
  { label: "Nama Z→A", value: "-nama" },
  { label: "Terbaru", value: "-created_at" },
  { label: "Terlama", value: "created_at" },
];

export default function CategoryFilters({ value, onChange }: Props) {
  const [search, setSearch] = useState(value.search ?? "");
  const [isActive, setIsActive] = useState<boolean | undefined>(value.is_active);
  const [sort, setSort] = useState<SortCategory>(value.sort ?? "nama");

  useEffect(() => {
    setSearch(value.search ?? "");
    setIsActive(value.is_active);
    setSort((value.sort as SortCategory) ?? "nama");
  }, [value]);

  return (
    <div>
      {/* Grid form, responsif, tanpa Tailwind */}
      <div className="form-row form-row--3" style={{ marginBottom: 12 }}>
        {/* Pencarian */}
        <div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Pencarian</div>
          <input
            className="input"
            placeholder="Cari nama/slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onChange({ ...value, search, page: 1 });
            }}
          />
        </div>

        {/* Status */}
        <div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Status</div>
          <select
            className="select"
            value={String(isActive)}
            onChange={(e) => {
              const v = e.target.value;
              const next = v === "undefined" ? undefined : v === "true";
              setIsActive(next);
              onChange({ ...value, is_active: next, page: 1 });
            }}
          >
            <option value="undefined">Semua</option>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Urutkan</div>
          <select
            className="select"
            value={sort}
            onChange={(e) => {
              const s = e.target.value as SortCategory;
              setSort(s);
              onChange({ ...value, sort: s, page: 1 });
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          className="button"
          onClick={() => {
            setSearch("");
            setIsActive(undefined);
            setSort("nama");
            onChange({ page: 1, per_page: value.per_page ?? 10 });
          }}
        >
          Reset
        </button>
        <button
          className="button button-primary"
          onClick={() =>
            onChange({ ...value, search, sort, is_active: isActive, page: 1 })
          }
        >
          Terapkan
        </button>
      </div>
    </div>
  );
}
