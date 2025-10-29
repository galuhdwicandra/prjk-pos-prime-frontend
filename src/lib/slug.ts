// src/lib/slug.ts
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    // ganti non-alfanumerik (termasuk spasi) jadi "-"
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    // hapus "-" di awal/akhir
    .replace(/^-+|-+$/g, "");
}
