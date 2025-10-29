// src/pages/delivery/DeliveryIndex.tsx
import React, { useEffect, useMemo, useState } from "react";
import { listDeliveries, assignCourier, updateStatus } from "../../api/deliveries";
import { sendWaybillWhatsapp, getWaybillHtml } from "../../api/deliveries";
import type { Delivery, DeliveryQuery } from "../../types/delivery";
import DeliveryTabs from "../../components/delivery/DeliveryTabs";
import AssignCourierSelect from "../../components/delivery/AssignCourierSelect";
import DeliveryStatusStepper from "../../components/delivery/DeliveryStatusStepper";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../../store/auth";

export default function DeliveryIndex(): React.ReactElement {
  const { user, hasRole } = useAuth();
  const [query, setQuery] = useState<DeliveryQuery>({ per_page: 10, page: 1, sort: "-requested_at" });
  const [tab, setTab] = useState<DeliveryQuery["status"] | "ALL">("ALL");
  const [items, setItems] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ current_page: 1, per_page: 10, total: 0, last_page: 1 });

  const canAssign = hasRole("superadmin") || hasRole("admin_cabang") || hasRole("kasir") || hasRole("gudang");
  const canProgress = hasRole("superadmin") || hasRole("admin_cabang") || hasRole("kurir") || hasRole("kasir") || hasRole("gudang");

  const appliedQuery = useMemo(() => {
    const base: DeliveryQuery = { ...query };
    if (tab && tab !== "ALL") base.status = tab;
    if (hasRole("kurir") && user) base.mine = 1;
    return base;
  }, [query, tab, hasRole, user]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    listDeliveries(appliedQuery)
      .then((p) => {
        if (!live) return;
        setItems(p.data);
        setMeta(p.meta);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      live = false;
    };
  }, [appliedQuery]);

  async function openWaybill(id: number) { // ADD
    try {
      const html = await getWaybillHtml(id);
      const w = window.open("", "_blank", "noopener,noreferrer");
      if (w) {
        w.document.open();
        w.document.write(html);
        w.document.close();
      } else {
        alert("Popup diblokir. Izinkan pop-up untuk melihat surat jalan.");
      }
    } catch (e) {
      alert((e as Error).message || "Gagal memuat surat jalan.");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Pickup & Delivery</h1>
      </div>

      {/* Toolbar */}
      <div className="card">
        <div className="toolbar">
          <div className="toolbar-left">
            <DeliveryTabs value={tab ?? "ALL"} onChange={(k) => setTab(k === "ALL" ? "ALL" : k)} />
          </div>
          <div className="toolbar-right">
            <input
              className="input"
              placeholder="Cari kode/alamat…"
              value={query.q ?? ""}
              onChange={(e) => setQuery((q) => ({ ...q, q: e.target.value, page: 1 }))}
            />
          </div>
        </div>
      </div>

      {/* Tabel daftar */}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Jenis</th>
                <th>Kurir</th>
                <th>Status</th>
                <th>Alamat</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6}>Memuat…</td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6}>Tidak ada data.</td>
                </tr>
              )}
              {items.map((d) => (
                <tr key={d.id}>
                  <td className="mono">
                    <Link to={`/delivery/${d.id}`} className="link">
                      {d.order_code ?? `#${d.order_id}`}
                    </Link>
                  </td>
                  <td>{d.type}</td>
                  <td>
                    <div className="inline-flex gap-8">
                      <span>{d.courier_name ?? "-"}</span>
                      {canAssign && ["REQUESTED", "ASSIGNED"].includes(d.status) && (
                        <AssignCourierSelect
                          value={d.assigned_to ?? null}
                          allowAuto
                          onChange={async (val) => {
                            const auto = val === -1;
                            try {
                              if (auto) {
                                await assignCourier(d.id, { auto: true });
                                setItems((arr) => arr.map((x) => (x.id === d.id ? { ...x } : x)));
                              } else {
                                const payload = val !== null ? { assigned_to: val } : {};
                                await assignCourier(d.id, payload);
                                setItems((arr) => arr.map((x) => (x.id === d.id ? { ...x, assigned_to: val } : x)));
                              }
                            } catch (err: unknown) {
                              if (isAxiosError(err)) {
                                if (err.response?.status === 403) {
                                  alert("Anda tidak memiliki izin untuk assign kurir di cabang ini.");
                                } else {
                                  const serverMsg = (err.response?.data as { message?: string } | undefined)?.message;
                                  alert(serverMsg ?? err.message ?? "Gagal assign kurir.");
                                }
                              } else {
                                alert((err as Error).message);
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    <DeliveryStatusStepper status={d.status} />
                  </td>
                  <td>
                    <div className="truncate-1">
                      {(d.pickup_address || d.delivery_address)
                        ? `${d.pickup_address ?? ""} ${d.delivery_address ? "→ " + d.delivery_address : ""}`
                        : "-"}
                    </div>
                  </td>
                  <td className="text-center">
                    {canProgress && ["ASSIGNED", "PICKED_UP", "ON_ROUTE"].includes(d.status) && (
                      <div className="inline-flex gap-8">
                        {d.status === "ASSIGNED" && (
                          <button
                            className="button button-outline"
                            onClick={async () => {
                              await updateStatus(d.id, { status: "PICKED_UP" as const });
                              setItems((xs) => xs.map((x) => (x.id === d.id ? { ...x, status: "PICKED_UP" } : x)));
                            }}
                          >
                            Mark Picked
                          </button>
                        )}
                        {d.status === "PICKED_UP" && (
                          <button
                            className="button button-outline"
                            onClick={async () => {
                              await updateStatus(d.id, { status: "ON_ROUTE" as const });
                              setItems((xs) => xs.map((x) => (x.id === d.id ? { ...x, status: "ON_ROUTE" } : x)));
                            }}
                          >
                            On Route
                          </button>
                        )}
                        {d.status === "ON_ROUTE" && (
                          <button
                            className="button button-primary"
                            onClick={async () => {
                              await updateStatus(d.id, { status: "DELIVERED" as const });
                              setItems((xs) => xs.map((x) => (x.id === d.id ? { ...x, status: "DELIVERED" } : x)));
                            }}
                          >
                            Delivered
                          </button>
                        )}

                        {/* === SURAT JALAN: tampil jika sudah ada kurir yang diassign === */}
                        {!!d.assigned_to && ["ASSIGNED", "PICKED_UP", "ON_ROUTE", "DELIVERED"].includes(d.status) && (
                          <>
                            <button
                              className="button button-outline"
                              onClick={() => openWaybill(d.id)}
                            >
                              Lihat / Print SJ
                            </button>
                            <button
                              className="button button-outline"
                              onClick={async () => {
                                try {
                                  const { wa_url } = await sendWaybillWhatsapp(d.id);
                                  window.open(wa_url, "_blank", "noopener");
                                } catch (e) {
                                  alert((e as Error).message || "Gagal menyiapkan WhatsApp.");
                                }
                              }}
                            >
                              WA Surat Jalan
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination ringkas */}
      <div className="card">
        <div className="toolbar">
          <div className="text-muted">Total: {meta.total}</div>
          <div className="inline-flex gap-8">
            <button
              className="button"
              disabled={meta.current_page <= 1}
              onClick={() => setQuery((q) => ({ ...q, page: Math.max(1, (q.page ?? 1) - 1) }))}
            >
              Prev
            </button>
            <div className="text-muted">Page {meta.current_page} / {meta.last_page}</div>
            <button
              className="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) + 1 }))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
