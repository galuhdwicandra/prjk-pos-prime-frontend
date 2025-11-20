// src/components/products/ProductTable.tsx
import { Link } from "react-router-dom";
import type { Product } from "../../types/product";

type Props = {
  rows: Product[];
  loading?: boolean;
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onEdit: (row: Product) => void;
  onVariants: (row: Product) => void;
  onMedia: (row: Product) => void;
  onDelete: (row: Product) => void;
};

/** Bentuk payload opsional yang mungkin ikut dari API */
type WithCategory = {
  category?: { id?: number; nama?: string } | null;
  category_name?: string | null;
  category_id?: number | null;
};
type WithVariants = {
  variants_count?: number;
  variants?: unknown[] | null;
};
type WithMedia = {
  media_count?: number;
  media?: unknown[] | null;
};

/** Type guard util – tanpa `any` */
function hasCategory(x: Product): x is Product & WithCategory {
  const o = x as unknown as object;
  return "category" in o || "category_name" in o || "category_id" in o;
}
function hasVariants(x: Product): x is Product & WithVariants {
  const o = x as unknown as object;
  return "variants_count" in o || "variants" in o;
}
function hasMedia(x: Product): x is Product & WithMedia {
  const o = x as unknown as object;
  return "media_count" in o || "media" in o;
}

function resolveCategoryName(r: Product): string {
  if (hasCategory(r)) {
    if (r.category && typeof r.category.nama === "string" && r.category.nama.trim() !== "") {
      return r.category.nama;
    }
    if (typeof r.category_name === "string" && r.category_name.trim() !== "") {
      return r.category_name;
    }
    if (typeof r.category_id === "number") {
      return `#${r.category_id}`;
    }
  }
  return "–";
}

function resolveVariantsCount(r: Product): number {
  if (hasVariants(r)) {
    if (typeof r.variants_count === "number") return r.variants_count;
    if (Array.isArray(r.variants)) return r.variants.length;
  }
  return 0;
}

function resolveMediaCount(r: Product): number {
  if (hasMedia(r)) {
    if (typeof r.media_count === "number") return r.media_count;
    if (Array.isArray(r.media)) return r.media.length;
  }
  return 0;
}

export default function ProductTable({
  rows,
  loading,
  page,
  perPage,
  total,
  onPageChange,
  onEdit,
  onVariants,
  onMedia,
  onDelete,
}: Props) {
  const lastPage = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Kategori</th>
            <th>Status</th>
            <th style={{ textAlign: "right" }}>Varian</th>
            <th style={{ textAlign: "right" }}>Media</th>
            <th style={{ textAlign: "right" }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="muted" style={{ textAlign: "center" }}>
                Memuat…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="muted" style={{ textAlign: "center" }}>
                Tidak ada data.
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const categoryLabel = resolveCategoryName(r);
              const variantsCount = resolveVariantsCount(r);
              const mediaCount = resolveMediaCount(r);

              return (
                <tr key={r.id}>
                  <td>
                    <div className="text-strong">
                      <Link to={`/catalog/products/${r.id}`} className="link">
                        {r.nama}
                      </Link>
                    </div>
                    <div className="muted text-xs">{r.slug}</div>
                  </td>

                  <td>{categoryLabel}</td>

                  <td>
                    <span
                      className={
                        r.is_active ? "badge badge-success" : "badge"
                      }
                    >
                      {r.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>

                  <td style={{ textAlign: "right" }}>{variantsCount}</td>
                  <td style={{ textAlign: "right" }}>{mediaCount}</td>

                  <td style={{ textAlign: "right" }}>
                    <div className="row row--end row--gap-sm">
                      <button className="button" onClick={() => onVariants(r)}>
                        Varian
                      </button>
                      <button className="button" onClick={() => onMedia(r)}>
                        Media
                      </button>
                      <button className="button" onClick={() => onEdit(r)}>
                        Edit
                      </button>
                      <button
                        className="button button-outline"
                        onClick={() => onDelete(r)}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* pagination */}
      <div className="row row--between" style={{ padding: "0.75rem 1rem" }}>
        <div className="muted text-sm">
          Halaman {page} dari {lastPage} • Total {total}
        </div>
        <div className="row row--gap-sm">
          <button
            className="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </button>
          <button
            className="button"
            disabled={page >= lastPage}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
