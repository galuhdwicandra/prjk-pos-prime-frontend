// src/components/settings/BackupRestorePanel.tsx
import { useState } from 'react';
import type { SettingExportQuery, SettingImportPayload, SettingUpsertPayload } from '../../types/settings';
import { exportSettings, importSettings } from '../../api/settings';

export default function BackupRestorePanel() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportJson, setExportJson] = useState<string>('');
  const [importJson, setImportJson] = useState<string>('');
  const [msg, setMsg] = useState<string | null>(null);

  async function doExport() {
    setMsg(null);
    try {
      setExporting(true);
      const params: SettingExportQuery = { format: 'json' };
      const data = await exportSettings(params);
      setExportJson(JSON.stringify(data, null, 2));
      setMsg('Settings exported.');
    } catch {
      setMsg('Export failed.');
    } finally {
      setExporting(false);
    }
  }

  async function doImport() {
    setMsg(null);
    try {
      setImporting(true);
      const parsed = JSON.parse(importJson) as { items: SettingUpsertPayload[] };
      const payload: SettingImportPayload = { items: parsed.items, mode: 'merge' };
      await importSettings(payload);
      setMsg('Settings imported.');
    } catch {
      setMsg('Import failed — make sure JSON is valid.');
    } finally {
      setImporting(false);
    }
  }

  const isError = typeof msg === 'string' && /failed/i.test(msg);

  return (
    <div>
      {/* Export */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h3 className="card-title" style={{ margin: 0 }}>Export</h3>
          <button type="button" onClick={doExport} disabled={exporting} className="button button-primary">
            {exporting ? 'Exporting…' : 'Export JSON'}
          </button>
        </div>

        <textarea
          className="textarea"
          rows={8}
          value={exportJson}
          onChange={(e) => setExportJson(e.target.value)}
          placeholder="Exported JSON will appear here"
          style={{ marginTop: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
        />
      </div>

      {/* Import */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h3 className="card-title" style={{ margin: 0 }}>Import</h3>
          <button type="button" onClick={doImport} disabled={importing} className="button button-primary">
            {importing ? 'Importing…' : 'Import JSON (merge)'}
          </button>
        </div>

        <textarea
          className="textarea"
          rows={8}
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder='Paste {"items":[{ "scope":"GLOBAL","key":"...","value":{...}}]}'
          style={{ marginTop: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
        />
      </div>

      {msg ? (
        <div className={`badge ${isError ? 'badge-danger' : 'badge-success'}`}>
          {msg}
        </div>
      ) : null}
    </div>
  );
}
