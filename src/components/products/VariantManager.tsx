// src/components/products/VariantManager.tsx
import { useCallback, useEffect, useState } from "react";
import type {
  ProductVariant,
  VariantCreatePayload,
  VariantUpdatePayload,
} from "../../types/product";
import {
  createVariant,
  deleteVariant,
  listVariants,
  updateVariant,
} from "../../api/products";
import PriceInput from "./PriceInput";

type Props = { productId: number };

export default function VariantManager({ productId }: Props) {
  const [rows, setRows] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [draftNew, setDraftNew] = useState<VariantCreatePayload>({
    size: "",
    type: "",
    tester: "",
    sku: "",
    harga: 0,
    is_active: true,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const arr = await listVariants(productId);
      setRows(arr);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message || "Gagal memuat varian.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function saveNew() {
    setSavingId("new");
    setError(null);
    const payload: VariantCreatePayload = {
      ...draftNew,
      size: draftNew.size || null,
      type: draftNew.type || null,
      tester: draftNew.tester || null,
      sku: String(draftNew.sku || "").trim(),
      harga: Number(draftNew.harga || 0),
      is_active: draftNew.is_active ?? true,
    };
    try {
      await createVariant(productId, payload);
      setDraftNew({
        size: "",
        type: "",
        tester: "",
        sku: "",
        harga: 0,
        is_active: true,
      });
      await refresh();
    } catch (e: unknown) {
      setError((e as { message?: string })?.message || "Gagal menambah varian.");
    } finally {
      setSavingId(null);
    }
  }

  async function saveEdit(row: ProductVariant) {
    setSavingId(row.id);
    setError(null);
    const payload: VariantUpdatePayload = {
      size: row.size || null,
      type: row.type || null,
      tester: row.tester || null,
      sku: String(row.sku || "").trim(),
      harga: Number(row.harga || 0),
      is_active: !!row.is_active,
    };
    try {
      await updateVariant(productId, row.id, payload);
      await refresh();
    } catch (e: unknown) {
      setError((e as { message?: string })?.message || "Gagal menyimpan varian.");
    } finally {
      setSavingId(null);
    }
  }

  async function remove(row: ProductVariant) {
    if (!confirm(`Hapus varian ${row.sku}?`)) return;
    setSavingId(row.id);
    setError(null);
    try {
      await deleteVariant(productId, row.id);
      await refresh();
    } catch (e: unknown) {
      setError((e as { message?: string })?.message || "Gagal menghapus varian.");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <div className="card">Memuat varian…</div>;

  return (
    <div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Size</th>
              <th>Type</th>
              <th>Tester</th>
              <th className="text-right">Harga</th>
              <th>Aktif</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    className="input"
                    value={r.sku}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) =>
                          x.id === r.id ? { ...x, sku: e.target.value } : x
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={r.size ?? ""}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) =>
                          x.id === r.id ? { ...x, size: e.target.value } : x
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={r.type ?? ""}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) =>
                          x.id === r.id ? { ...x, type: e.target.value } : x
                        )
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={r.tester ?? ""}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) =>
                          x.id === r.id ? { ...x, tester: e.target.value } : x
                        )
                      )
                    }
                  />
                </td>
                <td className="text-right">
                  <PriceInput
                    value={r.harga}
                    onChange={(next) =>
                      setRows((prev) =>
                        prev.map((x) =>
                          x.id === r.id ? { ...x, harga: next } : x
                        )
                      )
                    }
                  />
                </td>
                <td style={{ textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={!!r.is_active}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) =>
                          x.id === r.id
                            ? { ...x, is_active: e.target.checked }
                            : x
                        )
                      )
                    }
                  />
                </td>
                <td className="text-right">
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      className="button"
                      disabled={savingId === r.id}
                      onClick={() => saveEdit(r)}
                    >
                      {savingId === r.id ? "Menyimpan…" : "Simpan"}
                    </button>
                    <button
                      className="button"
                      disabled={savingId === r.id}
                      onClick={() => remove(r)}
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Row tambah baru */}
            <tr>
              <td>
                <input
                  className="input"
                  placeholder="SKU"
                  value={draftNew.sku}
                  onChange={(e) => setDraftNew((d) => ({ ...d, sku: e.target.value }))}
                />
              </td>
              <td>
                <input
                  className="input"
                  placeholder="Size"
                  value={draftNew.size ?? ""}
                  onChange={(e) => setDraftNew((d) => ({ ...d, size: e.target.value }))}
                />
              </td>
              <td>
                <input
                  className="input"
                  placeholder="Type"
                  value={draftNew.type ?? ""}
                  onChange={(e) => setDraftNew((d) => ({ ...d, type: e.target.value }))}
                />
              </td>
              <td>
                <input
                  className="input"
                  placeholder="Tester"
                  value={draftNew.tester ?? ""}
                  onChange={(e) =>
                    setDraftNew((d) => ({ ...d, tester: e.target.value }))
                  }
                />
              </td>
              <td className="text-right">
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  value={draftNew.harga}
                  onChange={(e) =>
                    setDraftNew((d) => ({
                      ...d,
                      harga: Number(e.target.value || 0),
                    }))
                  }
                />
              </td>
              <td style={{ textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={!!draftNew.is_active}
                  onChange={(e) =>
                    setDraftNew((d) => ({ ...d, is_active: e.target.checked }))
                  }
                />
              </td>
              <td className="text-right">
                <button
                  className="button"
                  disabled={savingId === "new"}
                  onClick={saveNew}
                >
                  {savingId === "new" ? "Menambah…" : "Tambah"}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {error && (
        <div style={{ marginTop: 8 }}>
          <span className="badge badge-danger">{error}</span>
        </div>
      )}
    </div>
  );
}
