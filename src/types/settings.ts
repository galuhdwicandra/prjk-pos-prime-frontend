/** Settings — hierarchical config with GLOBAL/BRANCH/USER scopes. */
export type SettingScope = 'GLOBAL' | 'BRANCH' | 'USER';

export interface Setting {
    id: number;
    scope: SettingScope;
    scope_id: number | null;
    key: string;
    /** Backend stores JSON → we keep it as a shaped record */
    value: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

/** Query params for GET /settings */
export interface SettingQuery {
    scope?: SettingScope | null;
    scope_id?: number | null;
    keys?: string[] | null;
    page?: number;
    per_page?: number;
}

/** Single upsert payload */
export interface SettingUpsertPayload {
    scope: SettingScope;
    scope_id?: number | null;
    key: string;
    value: Record<string, unknown>;
}

/** Bulk upsert payload */
export type SettingBulkUpsertPayloadItem = SettingUpsertPayload;
export interface SettingBulkUpsertPayload {
    items: SettingBulkUpsertPayloadItem[];
}

/** Export request/response */
export interface SettingExportQuery {
    scope?: SettingScope | null;
    scope_id?: number | null;
    keys?: string[] | null;
    /** backend supports json format */
    format?: 'json';
}
export interface SettingExportData {
    items: SettingUpsertPayload[]; // normalized list
}

/** Import payload/response */
export type SettingImportMode = 'replace' | 'merge' | 'skip';
export interface SettingImportPayload {
    items: SettingUpsertPayload[];
    mode?: SettingImportMode;
}
export interface SettingImportResult {
    inserted: number;
    updated: number;
    skipped: number;
}

/** Laravel paginator for settings list */
export interface LaravelPaginator<T> {
    current_page: number;
    data: T[];
    first_page_url: string | null;
    from: number | null;
    last_page: number;
    last_page_url: string | null;
    links: { url: string | null; label: string; page: number | null; active: boolean }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}
