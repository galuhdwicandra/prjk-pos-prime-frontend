// src/components/stock/StockTable.tsx
import type { Stock } from "../../types/stock";
import LowStockIndicator from "./LowStockIndicator";

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

type Props = {
  rows: Stock[];
  loading?: boolean;
  onEditMin?: (row: Stock) => void;
};

export default function StockTable({ rows, loading, onEditMin }: Props) {
  if (loading) {
    return <div>Memuat stok...</div>;
  }

  if (!rows?.length) {
    return <div>Belum ada data stok.</div>;
  }

  return (
    <div>
      <table className="table">
        <thead>
          <tr>
            <th>Variant</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Min</th>
            <th>Status</th>
            <th className="text-right">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => {
            const isLow =
              !!r.is_low_stock ||
              (typeof r.qty === "number" &&
                typeof r.min_stok === "number" &&
                r.qty < r.min_stok);

            return (
              <tr key={r.id}>
                {/* VARIANT + LOKASI */}
                <td>
                  <div className="font-medium">
                    {r.variant?.nama_produk ?? `Variant #${r.product_variant_id}`}
                  </div>

                  <div className="mt-2">
                    <span>SKU: {r.variant?.sku ?? "-"}</span>

                    {/* Cabang & Gudang tampil sebagai badge kecil agar informatif */}
                    <span className="badge" style={{ marginLeft: 8 }}>
                      Cabang: {r.cabang?.nama ?? `#${r.cabang_id}`}
                    </span>
                    <span className="badge" style={{ marginLeft: 6 }}>
                      Gudang: {r.gudang?.nama ?? `#${r.gudang_id}`}
                    </span>
                  </div>
                </td>

                {/* QTY */}
                <td className="text-right">
                  <span title={isLow ? "Qty di bawah Min Stok" : "Qty"}>
                    {fmt(r.qty)}
                  </span>
                </td>

                {/* MIN STOK */}
                <td className="text-right">
                  <span>{fmt(r.min_stok)}</span>
                </td>

                {/* STATUS */}
                <td>
                  <LowStockIndicator low={isLow} />
                </td>

                {/* AKSI */}
                <td className="text-right">
                  <div>
                    {onEditMin && (
                      <button
                        className="button button-outline"
                        onClick={() => onEditMin(r)}
                        title="Ubah Min Stok"
                        aria-label={`Ubah Min Stok untuk ${r.variant?.sku ?? `Variant ${r.product_variant_id}`}`}
                      >
                        Ubah Min
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
