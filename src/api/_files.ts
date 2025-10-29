// src/api/_files.ts
/**
 * Util URL media (gambar/file) yang tahan berbagai kasus:
 * - Jika backend sudah kirim absolute URL (http/https), langsung pakai.
 * - Jika path adalah data: atau blob:, langsung pakai (untuk preview lokal).
 * - Jika path relatif (contoh: "products/a.jpg"), akan dibentuk menjadi
 *   `${BASE}/storage/products/a.jpg`, dengan normalisasi slash yang aman.
 * - Jika path sudah mengandung "storage/...", tidak digandakan (hindari /storage/storage/...).
 * - Jika VITE_FILES_BASE_URL kosong, coba fallback dari VITE_API_BASE_URL (potong "/api" ke belakang).
 */

type Env = {
  VITE_FILES_BASE_URL?: string;
  VITE_API_BASE_URL?: string;
  VITE_API_URL?: string;
};

const ENV = (import.meta.env as unknown as Env) ?? {};

const pickApiBase = (): string | undefined => {
  const raw = ENV.VITE_API_BASE_URL || ENV.VITE_API_URL;
  if (!raw) return undefined;
  // potong segmen '/api...' agar jadi origin + base app
  // contoh: http://localhost:8000/api/v1 -> http://localhost:8000
  try {
    const u = new URL(raw);
    const trimmed = u.pathname.replace(/\/api.*$/i, ""); // hapus mulai '/api'
    u.pathname = trimmed || "/";
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/+$/, "");
  } catch {
    return undefined;
  }
};

const RAW = ENV.VITE_FILES_BASE_URL || pickApiBase() || "";
const BASE = RAW ? RAW.replace(/\/+$/, "") : "";

/** Helper: cek absolute http(s) URL */
const isHttpUrl = (s: string) => /^https?:\/\//i.test(s);
/** Helper: dukung data: dan blob: (preview lokal/browser) */
const isSpecialUrl = (s: string) => /^(data:|blob:)/i.test(s);

/** Normalisasi path relatif agar tidak dobel 'storage/' dan tanpa leading slash berlebih */
const normalizeRelPath = (p: string): string => {
  let path = String(p).trim();
  // buang leading slash
  path = path.replace(/^\/+/, "");
  // buang leading 'storage/' jika sudah ada (kita akan menambahkan 'storage/' sendiri)
  path = path.replace(/^storage\/+/i, "");
  return path;
};

/**
 * Bangun URL untuk media berbasis path relatif (disk 'public').
 * - Kembalikan `null` jika BASE belum terdefinisi atau path falsy.
 * - Jika `path` sudah absolute/data/blob → return apa adanya.
 */
export function mediaPathToUrl(path?: string | null): string | null {
  if (!path) return null;
  const s = String(path);
  if (isHttpUrl(s) || isSpecialUrl(s)) return s;
  if (!BASE) return null;
  const rel = normalizeRelPath(s);
  return `${BASE}/storage/${rel}`;
}

/**
 * Helper praktis:
 * Terima `imageUrl` (mungkin sudah absolute dari backend) atau `mediaPath` (relatif).
 * Kembalikan URL siap pakai atau `null` jika keduanya tidak valid.
 */
export function ensureImageUrl(
  imageUrl?: string | null,
  mediaPath?: string | null
): string | null {
  // Prioritas: imageUrl absolut lebih dipercaya
  if (imageUrl) {
    if (isHttpUrl(imageUrl) || isSpecialUrl(imageUrl)) return imageUrl;
    // Jika backend kirim 'storage/xxx.jpg' di imageUrl, tetap normalkan
    const rel = normalizeRelPath(imageUrl);
    if (BASE) return `${BASE}/storage/${rel}`;
  }
  return mediaPathToUrl(mediaPath ?? undefined);
}

/**
 * Optional: util untuk debugging env di runtime (tidak dipanggil otomatis).
 * Bisa Anda panggil sekali di bootstrap agar cepat tahu salah env.
 */
export function assertFilesBaseOrWarn(): void {
  if (!BASE) {
    console.warn(
      "[_files] VITE_FILES_BASE_URL tidak di-set dan tidak berhasil fallback dari VITE_API_BASE_URL. Gambar mungkin tidak tampil."
    );
  }
}
