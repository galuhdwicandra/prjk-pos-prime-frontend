// src/pages/pos/OrdersIndex.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  listOrders, getOrder, updateOrderItems, reprintReceipt, resendWhatsApp, addPayment, setOrderCashPosition // <— setOrderCashPosition sudah di sini
} from "../../api/pos";
import type {
  ID, Order, OrderItem, OrdersQuery, UpdateOrderItemsPayload, OrderStatus, CheckoutPayment, CashPosition // <— CashPosition type
} from "../../types/pos";
import { createDelivery, assignCourier } from "../../api/deliveries";
import type { DeliveryType } from "../../types/delivery";
import { listCashHolders } from "../../api/cash";
import type { CashHolder } from "../../types/cash";
import { useAuth } from "../../store/auth";

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

/* ---------- FilterBar ---------- */
type FilterState = OrdersQuery & { local_q?: string; cash_position?: CashPosition };

function FilterBar(props: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  onApply: () => void;
}) {
  const { value, onChange, onApply } = props;
  const [search, setSearch] = useState(value.local_q ?? value.q ?? "");
  useEffect(() => setSearch(value.local_q ?? value.q ?? ""), [value.local_q, value.q]);

  return (
    <div className="card">
      <div className="form-row form-row--3">
        <div className="form-field">
          <label className="label">Cari</label>
          <input
            className="input"
            placeholder="kode/nama/telepon"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onChange({ ...value, q: search || undefined, page: 1 });
            }}
          />
        </div>

        <div className="form-field">
          <label className="label">Cabang ID</label>
          <input
            type="number"
            className="input"
            value={value.cabang_id ?? ""}
            onChange={(e) =>
              onChange({ ...value, cabang_id: e.target.value ? Number(e.target.value) : undefined, page: 1 })
            }
          />
        </div>

        <div className="form-field">
          <label className="label">Status</label>
          <select
            className="select"
            value={value.status ?? ""}
            onChange={(e) =>
              onChange({ ...value, status: (e.target.value || undefined) as OrderStatus | undefined, page: 1 })
            }
          >
            <option value="">Semua</option>
            <option value="DRAFT">DRAFT</option>
            <option value="UNPAID">UNPAID</option>
            <option value="PAID">PAID</option>
            <option value="VOID">VOID</option>
            <option value="REFUND">REFUND</option>
          </select>
        </div>

        {/* Filter Posisi Uang */}
        <div className="form-field">
          <label className="label">Posisi Uang</label>
          <select
            className="select"
            value={value.cash_position ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                cash_position: (e.target.value || undefined) as CashPosition | undefined,
                page: 1,
              })
            }
          >
            <option value="">Semua</option>
            <option value="CUSTOMER">Konsumen</option>
            <option value="CASHIER">Kasir</option>
            <option value="SALES">Sales</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div className="form-field">
          <label className="label">Dari</label>
          <input
            type="date"
            className="input"
            value={value.date_from ?? ""}
            onChange={(e) => onChange({ ...value, date_from: e.target.value || undefined, page: 1 })}
          />
        </div>

        <div className="form-field">
          <label className="label">Sampai</label>
          <input
            type="date"
            className="input"
            value={value.date_to ?? ""}
            onChange={(e) => onChange({ ...value, date_to: e.target.value || undefined, page: 1 })}
          />
        </div>

        <div className="form-actions" style={{ marginLeft: "auto" }}>
          <button
            className="button button-outline"
            onClick={() => onChange({ page: 1, per_page: value.per_page ?? 10, sort: "-ordered_at" })}
          >
            Reset
          </button>
          <button
            className="button button-primary"
            onClick={() => {
              onChange({ ...value, q: search || undefined, page: 1 });
              onApply();
            }}
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "PAID": return "badge badge-success";
    case "UNPAID": return "badge badge-warning";
    case "VOID":
    case "REFUND": return "badge badge-danger";
    default: return "badge";
  }
}

function normalizePhoneForWa(raw?: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  if (digits.startsWith('62')) return digits;
  return digits;
}

const CASH_POSITION_OPTIONS: { value: CashPosition; label: string }[] = [
  { value: 'CUSTOMER', label: 'Konsumen' },
  { value: 'CASHIER', label: 'Kasir' },
  { value: 'SALES', label: 'Sales' },
  { value: 'ADMIN', label: 'Admin' },
];

// Cell dropdown editable
function CashPositionCell({
  order,
  onChanged,
}: {
  order: Order;
  onChanged: (updated: Order) => void;
}) {
  const [val, setVal] = React.useState<CashPosition>(order.cash_position ?? 'CASHIER');
  const [saving, setSaving] = React.useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as CashPosition;
    setVal(next);
    setSaving(true);
    try {
      const updated = await setOrderCashPosition(order.id, next);
      onChanged(updated);
    } catch (err) {
      setVal(order.cash_position ?? 'CASHIER'); // rollback jika gagal
      alert((err as Error)?.message ?? 'Gagal mengubah Posisi Uang.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      className="select"
      value={val}
      onChange={handleChange}
      disabled={saving}
      style={{ minWidth: 140 }}
    >
      {CASH_POSITION_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

/* ---------- OrdersTable ---------- */
function OrdersTable(props: {
  rows: Order[];
  onOpenDetail: (id: ID) => void;
  page: number;
  per_page: number;
  total: number;
  onPage: (p: number) => void;
  onCashPositionChanged: (updated: Order) => void; // NEW prop
}) {
  const { rows, onOpenDetail, page, per_page, total, onPage, onCashPositionChanged } = props;
  const last = Math.max(1, Math.ceil(total / Math.max(1, per_page || 10)));

  return (
    <div className="card">
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Kode</th>
              <th>Pelanggan</th>
              <th>No HP</th>
              <th>Alamat</th>
              <th>Status</th>
              <th className="text-right">Subtotal</th>
              <th className="text-right">Diskon</th>
              <th className="text-right">Grand Total</th>
              <th className="text-right">Dibayar</th>
              <th>Posisi Uang</th>
              <th className="w-1">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>{new Date(o.ordered_at).toLocaleString("id-ID")}</td>
                <td><span className="mono">{o.kode}</span></td>
                <td>{o.customer_name ?? '-'}</td>
                <td>{o.customer_phone ?? '-'}</td>
                <td className="truncate max-w-[240px]">{o.customer_address ?? '-'}</td>
                <td><span className={statusBadgeClass(o.status)}>{o.status}</span></td>
                <td className="text-right">{formatIDR(o.subtotal)}</td>
                <td className="text-right">{formatIDR(o.discount)}</td>
                <td className="text-right"><strong>{formatIDR(o.grand_total)}</strong></td>
                <td className="text-right">{formatIDR(o.paid_total)}</td>
                <td>
                  <CashPositionCell order={o} onChanged={onCashPositionChanged} />
                </td>
                <td>
                  <div className="table-actions">
                    <button className="button button-outline" onClick={() => onOpenDetail(o.id)}>
                      Detail
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={12}>
                  <div className="empty-state">Tidak ada data untuk filter ini.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="muted text-sm">
          Halaman {page} dari {last} • Total {total} data
        </div>
        <div className="btn-group">
          <button className="button button-outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Prev
          </button>
          <button className="button button-outline" disabled={page >= last} onClick={() => onPage(page + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- shared inline styles for modal ---------- */
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
  zIndex: 1000
};

const modalStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 960,
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
};

/* ---------- Detail Dialog (Portal) ---------- */
function OrderDetailDialog(props: {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onEdit: (o: Order) => void;
  onReprint: (id: ID, format: "58" | "80") => void;
  onResendWa: (id: ID) => void;
}) {
  const { open, order, onClose, onEdit, onReprint, onResendWa } = props;

  const [dlOpen, setDlOpen] = useState(false);
  const [dlType, setDlType] = useState<DeliveryType>("DELIVERY");
  const [dlAuto, setDlAuto] = useState<boolean>(true);
  const [dlSubmitting, setDlSubmitting] = useState<boolean>(false);
  const [dlError, setDlError] = useState<string | null>(null);

  const sisa = Math.max(0, (order?.grand_total ?? 0) - (order?.paid_total ?? 0));
  if (!open || !order) return null;
  const o: Order = order;

  async function doCreateDelivery(): Promise<void> {
    setDlSubmitting(true);
    setDlError(null);
    try {
      const res = await createDelivery({ order_id: o.id, type: dlType });
      if (dlAuto) {
        try { await assignCourier(res.data.id, { auto: true }); } catch { /* noop */ }
      }
      alert("Delivery berhasil dibuat.");
      setDlOpen(false);
      onClose();
    } catch (e) {
      setDlError((e as Error)?.message ?? "Gagal membuat delivery.");
    } finally {
      setDlSubmitting(false);
    }
  }

  return createPortal(
    <div style={overlayStyle}>
      <div className="card" style={modalStyle} role="dialog" aria-modal="true">
        <div className="modal-header" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 className="modal-title">
            Detail Pesanan — <span className="mono">{o.kode}</span>
          </h3>
          <button className="button button-ghost" onClick={onClose}>Tutup</button>
        </div>

        <div className="divider" />

        <div className="kv-grid" style={{ padding: "0 16px 12px" }}>
          <div className="kv"><span className="kv-key">Status</span><span className="kv-val"><span className={statusBadgeClass(o.status)}>{o.status}</span></span></div>
          <div className="kv"><span className="kv-key">Tanggal</span><span className="kv-val">{new Date(o.ordered_at).toLocaleString("id-ID")}</span></div>
          <div className="kv"><span className="kv-key">Subtotal</span><span className="kv-val">{formatIDR(o.subtotal)}</span></div>
          <div className="kv"><span className="kv-key">Diskon</span><span className="kv-val">{formatIDR(o.discount)}</span></div>
          <div className="kv"><span className="kv-key">Total</span><span className="kv-val"><strong>{formatIDR(o.grand_total)}</strong></span></div>
          <div className="kv"><span className="kv-key">Dibayar</span><span className="kv-val">{formatIDR(o.paid_total)}</span></div>
        </div>

        <div className="card soft" style={{ margin: "0 16px 16px" }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="text-right">Harga</th>
                  <th className="text-right">Diskon</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {o.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.name_snapshot}</td>
                    <td className="text-right">{formatIDR(it.price)}</td>
                    <td className="text-right">{formatIDR(it.discount)}</td>
                    <td className="text-right">{it.qty}</td>
                    <td className="text-right">{formatIDR(it.line_total)}</td>
                  </tr>
                ))}
                {o.items.length === 0 && (
                  <tr><td colSpan={5}><div className="empty-state">Tidak ada item.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-actions" style={{ padding: "0 16px 16px", display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {o.status === "UNPAID" && sisa > 0 && (
            <button
              className="button button-primary"
              onClick={async () => {
                const nominalStr = prompt(`Nominal pelunasan (sisa ${formatIDR(sisa)}):`, String(Math.round(sisa)));
                if (!nominalStr) return;
                const nominal = Number(nominalStr);
                if (!Number.isFinite(nominal) || nominal <= 0) { alert("Nominal tidak valid."); return; }

                const methodInputRaw = (prompt("Metode (CASH/TRANSFER/QRIS):", "CASH") || "CASH");
                const methodInput = methodInputRaw.trim().toUpperCase();
                const payment: CheckoutPayment = { method: methodInput as CheckoutPayment["method"], amount: nominal };

                try {
                  if (methodInput === "CASH" && payment.amount > 0) {
                    const resp = await listCashHolders({ per_page: 100 });
                    const list: CashHolder[] = resp.data;
                    if (!Array.isArray(list) || list.length === 0) {
                      alert("Tidak ada CashHolder. Buat holder lebih dulu di modul Cash.");
                      return;
                    }
                    const choices = list.map((h) => `${h.id} — ${h.name}`).join('\n');
                    const picked = prompt(`Pilih Holder penerima CASH (masukkan ID):\n${choices}`);
                    const holderId = picked ? Number(picked.trim()) : NaN;
                    const holder = list.find((h) => h.id === holderId);
                    if (!holder) { alert("Holder tidak valid."); return; }

                    payment.payload_json = {
                      holder_id: holder.id,
                      collected_at: new Date().toISOString(),
                    };
                  }

                  await addPayment(o.id, payment);
                  alert("Pelunasan berhasil.");
                  onClose();
                } catch (e) {
                  alert((e as Error).message || "Gagal menambahkan pembayaran.");
                }
              }}
            >
              Pelunasan
            </button>
          )}

          <button className="button button-outline" onClick={() => onEdit(o)}>Edit Item</button>
          <button className="button button-outline" onClick={() => onReprint(o.id, "58")}>Reprint 58</button>
          <button className="button button-outline" onClick={() => onReprint(o.id, "80")}>Reprint 80</button>
          <button className="button" onClick={() => onResendWa(o.id)}>Kirim WA</button>
          <button className="button button-primary" onClick={() => setDlOpen(true)}>Buat Delivery…</button>
        </div>

        {dlOpen && createPortal(
          <div style={{ ...overlayStyle, zIndex: 1100 }}>
            <div className="card" style={{ ...modalStyle, maxWidth: 520 }} role="dialog" aria-modal="true">
              <div className="modal-header" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h4 className="modal-title">Buat Pickup/Delivery</h4>
                <button className="button button-ghost" onClick={() => setDlOpen(false)}>Tutup</button>
              </div>

              <div className="form-row" style={{ padding: "0 16px 16px" }}>
                <div className="form-field">
                  <label className="label">Jenis</label>
                  <select
                    className="select"
                    value={dlType}
                    onChange={(e) => setDlType(e.target.value as DeliveryType)}
                  >
                    <option value="PICKUP">PICKUP (Jemput)</option>
                    <option value="DELIVERY">DELIVERY (Antar)</option>
                    <option value="BOTH">BOTH (Jemput & Antar)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="checkbox">
                    <input type="checkbox" checked={dlAuto} onChange={(e) => setDlAuto(e.target.checked)} />
                    <span>Auto-assign kurir</span>
                  </label>
                </div>

                {dlError && <div className="alert alert-danger">{dlError}</div>}

                <div className="form-actions" style={{ marginLeft: "auto" }}>
                  <button className="button button-outline" onClick={() => setDlOpen(false)} disabled={dlSubmitting}>Batal</button>
                  <button className="button button-primary" onClick={doCreateDelivery} disabled={dlSubmitting}>
                    {dlSubmitting ? "Membuat…" : "Buat"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>,
    document.body
  );
}

/* ---------- Edit Dialog (Portal) ---------- */
function EditOrderDialog(props: {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onSaved: (updated: Order) => void;
}) {
  const { open, order, onClose, onSaved } = props;
  const [rows, setRows] = useState<OrderItem[]>([]);
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const subtotal = rows.reduce((acc, r) => acc + (r.price - r.discount) * r.qty, 0);
    return { subtotal, discount: 0, tax: 0, service_fee: 0, grand_total: subtotal };
  }, [rows]);

  useEffect(() => {
    if (open && order) {
      setRows(order.items.map((i) => ({ ...i })));
      setNote("");
    }
  }, [open, order]);

  if (!open || !order) return null;

  const updateRow = (id: ID, patch: Partial<OrderItem>) => {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: UpdateOrderItemsPayload = {
        note: note || null,
        items: rows.map((r) => ({
          id: r.id,
          price: Number(r.price),
          discount: Number(r.discount),
          qty: Number(r.qty),
        })),
      };
      const updated = await updateOrderItems(order.id, payload);
      onSaved(updated);
    } catch (e) {
      alert((e as Error).message || "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div style={overlayStyle}>
      <div className="card" style={modalStyle} role="dialog" aria-modal="true">
        <div className="modal-header" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 className="modal-title">Edit Item — <span className="mono">{order.kode}</span></h3>
          <button className="button button-ghost" onClick={onClose}>Tutup</button>
        </div>

        <div className="card soft" style={{ margin: "0 16px 16px" }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="text-right">Harga</th>
                  <th className="text-right">Diskon</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const lt = (Number(r.price) - Number(r.discount)) * Number(r.qty);
                  return (
                    <tr key={r.id}>
                      <td>{r.name_snapshot}</td>
                      <td className="text-right">
                        <input
                          className="input text-right"
                          type="number"
                          inputMode="numeric"
                          value={r.price}
                          onChange={(e) => updateRow(r.id, { price: Number(e.target.value || 0) })}
                        />
                      </td>
                      <td className="text-right">
                        <input
                          className="input text-right"
                          type="number"
                          inputMode="numeric"
                          value={r.discount}
                          onChange={(e) => updateRow(r.id, { discount: Number(e.target.value || 0) })}
                        />
                      </td>
                      <td className="text-right">
                        <input
                          className="input text-right"
                          type="number"
                          inputMode="numeric"
                          value={r.qty}
                          onChange={(e) => updateRow(r.id, { qty: Number(e.target.value || 0) })}
                        />
                      </td>
                      <td className="text-right">{formatIDR(lt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="form-row" style={{ padding: "0 16px 16px" }}>
          <div className="form-field">
            <label className="label">Catatan Koreksi (opsional)</label>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="form-field" style={{ marginLeft: "auto", textAlign: "right" }}>
            <div>Subtotal (preview): <strong>{formatIDR(totals.subtotal)}</strong></div>
            <div>Total (preview): <strong>{formatIDR(totals.grand_total)}</strong></div>
            <div className="muted text-xs">Total final mengikuti hasil server setelah simpan.</div>
          </div>
        </div>

        <div className="modal-actions" style={{ padding: "0 16px 16px", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="button button-outline" onClick={onClose} disabled={saving}>Batal</button>
          <button className="button button-primary" onClick={save} disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- Page ---------- */
export default function OrdersIndex(): React.ReactElement {
  useAuth();

  const [q, setQ] = useState<FilterState>({
    page: 1,
    per_page: 10,
    sort: "-ordered_at",
  });
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Order[]>([]);
  const [meta, setMeta] = useState<{ current_page: number; per_page: number; total: number; last_page: number }>({
    current_page: 1, per_page: 10, total: 0, last_page: 1
  });

  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detail, setDetail] = useState<Order | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listOrders({
        page: q.page, per_page: q.per_page, q: q.q, cabang_id: q.cabang_id, status: q.status,
        date_from: q.date_from, date_to: q.date_to, sort: q.sort,
        cash_position: q.cash_position, // sudah dikirim
      });

      setRows(res.data);
      setMeta({
        current_page: res.meta.current_page,
        per_page: res.meta.per_page,
        total: res.meta.total,
        last_page: res.meta.last_page,
      });

      const per = Math.max(1, res.meta.per_page || 10);
      const pgLast = Math.max(1, Math.ceil(res.meta.total / per));
      if ((q.page ?? 1) > pgLast) {
        setQ((s) => ({ ...s, page: pgLast }));
      }
    } catch (e) {
      alert((e as Error).message || "Gagal memuat pesanan.");
    } finally {
      setLoading(false);
    }
  // NEW: tambahkan q.cash_position di deps agar reload saat filter posisi berubah
  }, [q.page, q.per_page, q.q, q.cabang_id, q.status, q.date_from, q.date_to, q.sort, q.cash_position]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id: ID) => {
    try {
      const o = await getOrder(id);
      setDetail(o);
      setDetailOpen(true);
    } catch (e) {
      alert((e as Error).message || "Gagal memuat detail.");
    }
  };

  const onReprint = async (id: ID, format: '58' | '80') => {
    try {
      await reprintReceipt(id, { format });
      alert(`Berhasil reprint (${format}mm).`);
    } catch (e) {
      alert((e as Error).message || "Gagal reprint.");
    }
  };

  const onResendWa = async (id: ID) => {
    const snapPhone = detail?.customer_phone
      ?? rows.find(r => r.id === id)?.customer_phone
      ?? null;

    const normalized = normalizePhoneForWa(snapPhone);

    if (normalized) {
      try {
        const res = await resendWhatsApp(id, { phone: normalized });
        if (res.wa_url) {
          window.open(res.wa_url, "_blank", "noopener,noreferrer");
        } else {
          alert("Pesan WA diproses.");
        }
        return;
      } catch (e) {
        alert((e as Error).message || "Gagal kirim WA.");
        return;
      }
    }

    const manual = prompt("Nomor WhatsApp (628xxxxxxxxxx):")?.trim();
    const normalizedManual = normalizePhoneForWa(manual ?? "");
    if (!normalizedManual) return;

    try {
      const res = await resendWhatsApp(id, { phone: normalizedManual });
      if (res.wa_url) {
        window.open(res.wa_url, "_blank", "noopener,noreferrer");
      } else {
        alert("Pesan WA diproses.");
      }
    } catch (e) {
      alert((e as Error).message || "Gagal kirim WA.");
    }
  };

  // NEW: handler untuk merge update posisi uang ke state rows
  const onCashPositionChanged = useCallback((updated: Order) => {
    setRows((prev) => prev.map(r => (r.id === updated.id ? { ...r, cash_position: updated.cash_position } : r)));
    // optional: kalau detail sedang terbuka & sama id-nya, sinkronkan juga
    setDetail((cur) => (cur && cur.id === updated.id ? { ...cur, cash_position: updated.cash_position } as Order : cur));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Daftar Pesanan</h2>
      </div>

      <FilterBar value={q} onChange={setQ} onApply={load} />

      {loading ? (
        <div className="card"><div className="skeleton h-64" /></div>
      ) : (
        <OrdersTable
          rows={rows}
          onOpenDetail={openDetail}
          page={meta.current_page}
          per_page={meta.per_page}
          total={meta.total}
          onPage={(p) => setQ((s) => ({ ...s, page: p }))}
          onCashPositionChanged={onCashPositionChanged} // NEW: pass down
        />
      )}

      <OrderDetailDialog
        open={detailOpen}
        order={detail}
        onClose={() => {
          setDetailOpen(false);
          setQ((s) => ({ ...s })); // reload daftar
        }}
        onEdit={(o) => { setDetail(o); setEditOpen(true); }}
        onReprint={onReprint}
        onResendWa={onResendWa}
      />

      <EditOrderDialog
        open={editOpen}
        order={detail}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          setDetailOpen(false);
          setDetail(null);
          setQ((s) => ({ ...s })); // refresh
        }}
      />
    </div>
  );
}
