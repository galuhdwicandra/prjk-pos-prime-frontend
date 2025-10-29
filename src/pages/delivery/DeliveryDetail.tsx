// src/pages/delivery/DeliveryDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { damageClaim, getDelivery, updateStatus, assignCourier } from "../../api/deliveries";
import type { DeliveryDetail } from "../../types/delivery";
import DeliveryStatusStepper from "../../components/delivery/DeliveryStatusStepper";
import AssignCourierSelect from "../../components/delivery/AssignCourierSelect";
import DamageClaimDialog from "../../components/delivery/DamageClaimDialog";
import WaybillPreview from "../../components/delivery/WaybillPreview";
import { getWaybillHtml, sendWaybillWhatsapp } from "../../api/deliveries";
import { isAxiosError } from "axios";
import { useAuth } from "../../store/auth";

export default function DeliveryDetail(): React.ReactElement {
  const { id } = useParams();
  const nav = useNavigate();
  const { hasRole } = useAuth();

  const [data, setData] = useState<DeliveryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [openClaim, setOpenClaim] = useState(false);

  const [wbOpen, setWbOpen] = useState(false);
  const [wbHtml, setWbHtml] = useState<string>("");

  const canAssign = hasRole("superadmin") || hasRole("admin_cabang") || hasRole("kasir") || hasRole("gudang");
  const canProgress = hasRole("superadmin") || hasRole("admin_cabang") || hasRole("kurir") || hasRole("kasir") || hasRole("gudang");

  useEffect(() => {
    if (!id) return;
    let live = true;
    setLoading(true);
    getDelivery(Number(id))
      .then((d) => {
        if (!live) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      live = false;
    };
  }, [id]);

  if (loading) return <div>Memuat…</div>;
  if (!data)
    return (
      <div>
        Data tidak ditemukan.{" "}
        <button className="link" onClick={() => nav(-1)}>
          Kembali
        </button>
      </div>
    );

  // + Handler: buka preview Surat Jalan
  async function onOpenWaybill() {
    try {
      const html = await getWaybillHtml(data!.id);
      setWbHtml(html);
      setWbOpen(true);
    } catch (e) {
      alert((e as Error).message || "Gagal memuat surat jalan.");
    }
  }

  // + Handler: kirim link WA ke kurir
  async function onSendToCourier() {
    try {
      const { wa_url } = await sendWaybillWhatsapp(data!.id);
      window.open(wa_url, "_blank", "noopener");
    } catch (e) {
      alert((e as Error).message || "Gagal menyiapkan WhatsApp.");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Delivery Detail</h1>
        <Link className="link text-sm" to="/delivery">
          Kembali ke daftar
        </Link>
      </div>

      {/* Header info + status */}
      <div className="card">
        <div className="toolbar">
          <div className="mono">Order: {data.order_code ?? `#${data.order_id}`}</div>
          <DeliveryStatusStepper status={data.status} />
        </div>

        <div className="details">
          <div className="details-row">
            <span className="text-muted">Jenis:</span>
            <span>{data.type}</span>
          </div>
          <div className="details-row">
            <span className="text-muted">Kurir:</span>
            <span>{data.courier_name ?? "-"}</span>
          </div>
          <div className="details-row">
            <span className="text-muted">Pickup:</span>
            <span className="truncate-1">{data.pickup_address ?? "-"}</span>
          </div>
          <div className="details-row">
            <span className="text-muted">Delivery:</span>
            <span className="truncate-1">{data.delivery_address ?? "-"}</span>
          </div>
          <div className="details-row">
            <span className="text-muted">Requested:</span>
            <span>{new Date(data.requested_at).toLocaleString()}</span>
          </div>
          {data.completed_at && (
            <div className="details-row">
              <span className="text-muted">Completed:</span>
              <span>{new Date(data.completed_at).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Assign courier */}
        {canAssign && ["REQUESTED", "ASSIGNED"].includes(data.status) && (
          <div className="toolbar">
            <AssignCourierSelect
              value={data.assigned_to ?? null}
              allowAuto
              onChange={async (val) => {
                const auto = val === -1;
                try {
                  if (auto) {
                    await assignCourier(data.id, { auto: true });
                  } else {
                    const payload = val !== null ? { assigned_to: val } : {};
                    await assignCourier(data.id, payload);
                  }
                  const fresh = await getDelivery(data.id);
                  setData(fresh);
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
            <span className="text-muted text-sm">Pilih kurir atau Auto-assign.</span>
          </div>
        )}

        {/* Progress actions */}
        {canProgress && ["ASSIGNED", "PICKED_UP", "ON_ROUTE"].includes(data.status) && (
          <div className="toolbar">
            {data.status === "ASSIGNED" && (
              <button
                className="button button-outline"
                onClick={async () => {
                  await updateStatus(data.id, { status: "PICKED_UP" });
                  setData(await getDelivery(data.id));
                }}
              >
                Mark Picked
              </button>
            )}
            {data.status === "PICKED_UP" && (
              <button
                className="button button-outline"
                onClick={async () => {
                  await updateStatus(data.id, { status: "ON_ROUTE" });
                  setData(await getDelivery(data.id));
                }}
              >
                On Route
              </button>
            )}
            {data.status === "ON_ROUTE" && (
              <button
                className="button button-primary"
                onClick={async () => {
                  await updateStatus(data.id, { status: "DELIVERED" });
                  setData(await getDelivery(data.id));
                }}
              >
                Delivered
              </button>
            )}
            <button className="button" onClick={() => setOpenClaim(true)}>
              Klaim Kerusakan…
            </button>
          </div>
        )}
      </div>

      {/* Surat Jalan (muncul setelah assign kurir) */}
      {data.assigned_to && ["ASSIGNED", "PICKED_UP", "ON_ROUTE", "DELIVERED"].includes(data.status) && (
        <div className="toolbar">
          <button className="button button-outline" onClick={onOpenWaybill}>
            Lihat / Print Surat Jalan
          </button>
          <button className="button" onClick={onSendToCourier}>
            Kirim ke WhatsApp Kurir
          </button>
          <span className="text-muted text-sm">Surat Jalan otomatis tersedia setelah kurir di-assign.</span>
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <div className="card-header">Timeline</div>
        <ul className="list">
          {data.events.length === 0 && <li className="text-muted">Belum ada event.</li>}
          {data.events.map((ev) => (
            <li key={ev.id} className="card card--sub">
              <div className="toolbar">
                <div className="strong">{ev.status}</div>
                <div className="text-muted text-sm">{new Date(ev.occurred_at).toLocaleString()}</div>
              </div>
              {ev.note && <div className="mt-1">{ev.note}</div>}
              {ev.photo_url && (
                <a href={ev.photo_url} target="_blank" rel="noreferrer" className="link text-sm">
                  Lihat foto
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>

      <DamageClaimDialog
        open={openClaim}
        onClose={() => setOpenClaim(false)}
        onSubmit={async ({ note, file }) => {
          await damageClaim(data.id, { note: note ?? undefined, file: file ?? undefined });
          setOpenClaim(false);
          setData(await getDelivery(data.id));
        }}
      />
      {wbOpen && <WaybillPreview html={wbHtml} onClose={() => setWbOpen(false)} />}
    </div>
  );
}
