// src/api/deliveries.ts
import { api } from "./client";
import type {
    Delivery, DeliveryDetail, DeliveryPaged, DeliveryQuery,
    CreateDeliveryPayload, UpdateStatusPayload, DamageClaimPayload
} from "../types/delivery";
import type { WaybillInfo } from "../types/delivery";
import type { ID } from "../types/pos";

function toQuery(params: Record<string, unknown>): string {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        usp.set(k, String(v));
    });
    const q = usp.toString();
    return q ? `?${q}` : "";
}

/** GET /deliveries */
export async function listDeliveries(q: DeliveryQuery = {}): Promise<DeliveryPaged> {
    const { data } = await api.get<unknown>(`/deliveries${toQuery(q)}`);
    // normalisasi 3 bentuk paginator (kaya modul lain)
    const asAny = data as Record<string, unknown>;
    if (Array.isArray((asAny?.data as unknown[]))) {
        // case: { data: Delivery[], meta: {..} }
        if (asAny.meta && typeof asAny.meta === "object") {
            return { data: asAny.data as Delivery[], meta: asAny.meta as DeliveryPaged["meta"] };
        }
        // case: Laravel classic top-level paginator
        if (typeof asAny.current_page === "number") {
            const meta = {
                current_page: Number(asAny.current_page),
                per_page: Number(asAny.per_page ?? 10),
                total: Number(asAny.total ?? (Array.isArray(asAny.data) ? (asAny.data as unknown[]).length : 0)),
                last_page: Number(asAny.last_page ?? 1),
            };
            return { data: (asAny.data as Delivery[]) ?? [], meta };
        }
    }
    // fallback aman
    return { data: [], meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 } };
}

/** GET /deliveries/:id */
export async function getDelivery(id: ID): Promise<DeliveryDetail> {
    const { data } = await api.get<DeliveryDetail | { data: DeliveryDetail }>(`/deliveries/${id}`);
    return (data as { data?: DeliveryDetail })?.data ?? (data as DeliveryDetail);
}

/** POST /deliveries */
export async function createDelivery(payload: CreateDeliveryPayload): Promise<{ data: DeliveryDetail }> {
    const { data } = await api.post<{ data: DeliveryDetail }>(`/deliveries`, payload);
    return data;
}

/** POST /deliveries/:id/assign */
export async function assignCourier(id: ID, payload: { assigned_to?: number; auto?: boolean }) {
    const { data } = await api.post(`/deliveries/${id}/assign`, payload);
    return data;
}

/** POST /deliveries/:id/status */
export async function updateStatus(id: ID, payload: UpdateStatusPayload): Promise<{ message: string; data: DeliveryDetail }> {
    const { data } = await api.post<{ message: string; data: DeliveryDetail }>(`/deliveries/${id}/status`, payload);
    return data;
}

/** POST /deliveries/:id/damage-claim (multipart: photo) */
export async function damageClaim(id: ID, payload: DamageClaimPayload & { file?: File }): Promise<{ message: string }> {
    const fd = new FormData();
    if (payload.file) fd.append("file", payload.file);
    if (payload.note) fd.append("note", payload.note);
    const { data } = await api.post<{ message: string }>(`/deliveries/${id}/damage-claim`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}

export async function getWaybillInfo(id: number): Promise<WaybillInfo> {
    const { data } = await api.get<WaybillInfo | { data: WaybillInfo }>(`/deliveries/${id}/waybill-info`);
    return (data as { data?: WaybillInfo })?.data ?? (data as WaybillInfo);
}

function buildWaUrl(phoneRaw: string | undefined, text: string): string {
    const phone = (phoneRaw ?? "").replace(/\D+/g, "");
    // normalisasi awalan 0 → +62
    const e164 = phone.startsWith("62") ? phone : (phone.startsWith("0") ? `62${phone.slice(1)}` : phone);
    const encoded = encodeURIComponent(text);
    return `https://wa.me/${e164}?text=${encoded}`;
}

/** GET /deliveries/:id/waybill (HTML) — tampilkan/print */
export async function getWaybillHtml(id: number): Promise<string> {
    const { data } = await api.get<string | { html: string }>(`/deliveries/${id}/note`, {
        headers: { Accept: "text/html,application/json" },
        responseType: "text" as any,
    });
    if (typeof data === "string") return data;
    return (data as { html: string }).html ?? "";
}

export async function sendWaybillWhatsapp(id: number): Promise<{ message: string; wa_url: string }> {
    try {
        const res = await api.post<{ message: string; wa_url?: string; data?: { wa_url?: string; courier_phone?: string; text?: string } }>(
            `/deliveries/${id}/send-wa`,
            {}
        );
        const j = res.data ?? {};
        const wa = j.wa_url ?? j.data?.wa_url;
        if (wa) return { message: j.message ?? "OK", wa_url: wa };

        // backend balikin phone/text minimal → bangun sendiri
        const courierPhone = j.data?.courier_phone ?? "";
        const txt = j.data?.text ?? "Surat jalan tersedia. Silakan cek link/nota di aplikasi.";
        return { message: j.message ?? "OK", wa_url: buildWaUrl(courierPhone, txt) };
    } catch {
        // Fallback TANPA /meta: pakai detail delivery yang sudah ada
        const { data: d } = await api.get<{ data?: DeliveryDetail } | DeliveryDetail>(`/deliveries/${id}`);
        const delivery = (d as { data?: DeliveryDetail })?.data ?? (d as DeliveryDetail);

        // Ambil nomor kurir dari include ringan jika ada; jika tidak ada, tetap kirim pesan generik
        const phone = (delivery as any)?.courier_phone ?? ""; // jika backend mengirimkan field ini
        const code = delivery.order_code ? `#${delivery.order_code}` : `#DLV-${id}`;
        const txt = `Halo, ada Surat Jalan ${code}. Silakan cek detail di aplikasi. Terima kasih.`;
        return { message: "OK", wa_url: buildWaUrl(phone, txt) };
    }
}