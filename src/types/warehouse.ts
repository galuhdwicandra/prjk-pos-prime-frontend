export type Warehouse = {
  id: number;
  cabang_id: number;
  nama: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // include
  cabang?: { id: number; nama: string } | null;
};

export type WarehouseListResponse = {
  success: boolean;
  data: Warehouse[];
  meta: {
    current_page: number;
    per_page: number | string;
    total: number;
    last_page: number;
  };
};

export type WarehouseDetailResponse = {
  success: boolean;
  data: Warehouse;
};

export type WarehouseQuery = {
  q?: string;
  cabang_id?: number;
  is_active?: boolean;
  page?: number;
  per_page?: number | string;
  sort?: string; // "-id" | "id" | "cabang_id" | "nama" | "is_default" | "is_active" | "created_at"
};

export type WarehouseCreatePayload = {
  cabang_id: number;
  nama: string;
  is_default?: boolean;
  is_active?: boolean;
};

export type WarehouseUpdatePayload = Partial<WarehouseCreatePayload>;
