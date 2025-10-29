// src/components/products/ProductFilters.tsx
import type { ProductQuery } from "../../types/product";

type Props = {
  value: ProductQuery;
  categories: Array<{ id: number; nama: string }>;
  onChange: (next: ProductQuery) => void;
};

const SORTS: Array<{ v: ProductQuery["sort"]; label: string }> = [
  { v: "-created_at", label: "Terbaru" },
  { v: "created_at", label: "Terlama" },
  { v: "nama", label: "Nama (A-Z)" },
  { v: "-nama", label: "Nama (Z-A)" },
];

const PER_PAGES = [10, 25, 50, 100];

export default function ProductFilters({ value, categories, onChange }: Props) {
  return (
    <div>
      {/* Baris utama: Search, Kategori, Sort */}
      <div className="form-row form-row--3">
        <input
          className="input"
          placeholder="Cari nama produk…"
          value={value.search ?? ""}
          onChange={(e) => onChange({ ...value, page: 1, search: e.target.value })}
        />

        <select
          className="select"
          value={value.category_id ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              page: 1,
              category_id: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nama}
            </option>
          ))}
        </select>

        <select
          className="select"
          value={value.sort ?? "-created_at"}
          onChange={(e) => onChange({ ...value, page: 1, sort: e.target.value as ProductQuery["sort"] })}
        >
          {SORTS.map((s) => (
            <option key={s.v} value={s.v ?? ""}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Baris sekunder: checkbox aktif (kiri) & per_page (kanan) */}
      <div className="row row--between" style={{ marginTop: "0.75rem" }}>
        <label htmlFor="only-active" className="row row--center" style={{ gap: "0.5rem" }}>
          <input
            id="only-active"
            type="checkbox"
            className="checkbox"
            checked={!!value.is_active}
            onChange={(e) => onChange({ ...value, page: 1, is_active: e.target.checked })}
          />
          <span className="text-muted">Hanya aktif</span>
        </label>

        <div className="row row--center" style={{ gap: "0.5rem" }}>
          <span className="text-muted">Per halaman</span>
          <select
            className="select select--sm"
            value={value.per_page ?? 10}
            onChange={(e) => onChange({ ...value, page: 1, per_page: Number(e.target.value) })}
          >
            {PER_PAGES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
