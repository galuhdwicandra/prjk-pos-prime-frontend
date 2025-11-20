// src/types/product.ts

export type ID = number;

export type SortProduct =
    | "nama" | "-nama"
    | "created_at" | "-created_at";

export interface Product {
    id: ID;
    category_id: ID;
    nama: string;
    slug: string;
    deskripsi: string | null;
    is_active: boolean;
    created_at?: string | null;
    updated_at?: string | null;

    // opsional agregat dari backend
    variants_count?: number;
    media_count?: number;
    harga: number;
    // opsi include (jika endpoint detail mengembalikan relasi)
    variants?: ProductVariant[];
    media?: ProductMedia[];

    image_url?: string | null;
}

export interface ProductCreatePayload {
    category_id: ID;
    nama: string;
    slug?: string;          // frontend boleh set via slugify(nama)
    deskripsi?: string | null;
    is_active?: boolean;
}

export interface ProductUpdatePayload {
    category_id?: ID;
    nama?: string;
    slug?: string;
    deskripsi?: string | null;
    is_active?: boolean;
}

export interface ProductQuery {
    page?: number;
    per_page?: number;
    search?: string;
    category_id?: ID;
    is_active?: boolean;
    sort?: SortProduct;
    gudang_id?: ID;   // = warehouseId
    cabang_id?: ID;
}

export interface PaginatedMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginatedMeta;
}

/* ---------- VARIANTS ---------- */

export interface ProductVariant {
    id: ID;
    product_id: ID;
    size: string | null;     // ex: "Small", "Large"
    type: string | null;     // ex: "Choco", "Matcha"
    tester: string | null;   // ex: "Slice", "Full"
    sku: string;             // unique
    harga: number;           // decimal(14,2) -> number
    is_active: boolean;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface VariantCreatePayload {
    size?: string | null;
    type?: string | null;
    tester?: string | null;
    sku: string;
    harga: number;           // kirim sebagai number; axios akan serialize
    is_active?: boolean;
}

export interface VariantUpdatePayload {
    size?: string | null;
    type?: string | null;
    tester?: string | null;
    sku?: string;
    harga?: number;
    is_active?: boolean;
}

/* ---------- MEDIA ---------- */

export interface ProductMedia {
    id: ID;
    product_id: ID;
    disk: string;            // default 'public'
    path: string;            // ex: 'products/2/xxxx.jpg'
    mime: string | null;
    size_kb: number | null;
    is_primary: boolean;
    sort_order: number;      // smallint
    created_at?: string | null;
    updated_at?: string | null;

    // URL penuh (kalau backend mengembalikan accessor)
    url?: string;
    thumb_url?: string;
}

export interface MediaUploadResult {
    data: ProductMedia[];
}

export interface ApiError {
    status?: number;
    message?: string;
    errors?: Record<string, string[]>;
}
