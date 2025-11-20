import { api } from './client';
import type {
    LaravelPaginator,
    Setting,
    SettingQuery,
    SettingUpsertPayload,
    SettingBulkUpsertPayload,
    SettingExportQuery,
    SettingExportData,
    SettingImportPayload,
    SettingImportResult,
} from '../types/settings';

/** GET /api/v1/settings */
export async function listSettings(params: SettingQuery): Promise<LaravelPaginator<Setting>> {
    const { data } = await api.get<LaravelPaginator<Setting>>('/settings', { params });
    return data;
}

/** POST /api/v1/settings/upsert */
export async function upsertSetting(payload: SettingUpsertPayload): Promise<Setting> {
    const { data } = await api.post<{ data: Setting }>('/settings/upsert', payload);
    return data.data;
}

/** POST /api/v1/settings/bulk-upsert */
export async function bulkUpsertSettings(payload: SettingBulkUpsertPayload): Promise<number> {
    const { data } = await api.post<{ data: { count: number } }>('/settings/bulk-upsert', payload);
    return data.data.count;
}

/** DELETE /api/v1/settings/{id} */
export async function deleteSetting(id: number): Promise<void> {
    await api.delete(`/settings/${id}`);
}

/** GET /api/v1/settings/export */
export async function exportSettings(params: SettingExportQuery): Promise<SettingExportData> {
    const { data } = await api.get<{ data: SettingExportData }>('/settings/export', { params });
    return data.data;
}

/** POST /api/v1/settings/import */
export async function importSettings(payload: SettingImportPayload): Promise<SettingImportResult> {
    const { data } = await api.post<{ data: SettingImportResult; message: string }>('/settings/import', payload);
    return data.data;
}
