// src/pages/settings/SettingsIndex.tsx
import { useEffect, useState } from 'react';
import { listSettings } from '../../api/settings';
import type { LaravelPaginator, Setting, SettingQuery, SettingScope } from '../../types/settings';
import SettingsForm from '../../components/settings/SettingsForm';
import PreferenceToggles from '../../components/settings/PreferenceToggles';
import BackupRestorePanel from '../../components/settings/BackupRestorePanel';
import { useAuth } from '../../store/auth';

export default function SettingsIndex() {
  const { hasRole, user } = useAuth();
  const canAccess = hasRole('superadmin', 'admin_cabang', 'kasir');

  const [query, setQuery] = useState<SettingQuery>({ page: 1, per_page: 10 });
  const [rows, setRows] = useState<LaravelPaginator<Setting> | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await listSettings(query);
        if (!cancelled) setRows(data);
      } catch {
        if (!cancelled) setErr('Failed to load settings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const defaultScope: SettingScope = hasRole('superadmin')
    ? 'GLOBAL'
    : hasRole('admin_cabang')
    ? 'BRANCH'
    : 'USER';

  if (!canAccess) {
    return (
      <div>
        <h1>Settings</h1>
        <p className="muted">You are not allowed to access this page.</p>
      </div>
    );
  }

  function rowKey(r: Setting) {
    return r.id ? String(r.id) : `${r.scope}:${r.scope_id ?? '0'}:${r.key}`;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h1 className="card-title">Settings</h1>
        <p className="muted">Global / Branch / User preferences.</p>
      </div>

      {/* Cards Grid (stacked mobile-first) */}
      <div>
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="card-title">Numbering — Invoice</h2>
          <SettingsForm
            defaultScope={defaultScope}
            defaultScopeId={defaultScope === 'USER' ? user?.id ?? null : null}
            settingKey="numbering.invoice"
            valueTemplate={{ prefix: 'INV-', pad: 6, reset: 'daily' }}
          />
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="card-title">Receipt Footer</h2>
          <SettingsForm
            defaultScope={defaultScope}
            defaultScopeId={defaultScope === 'USER' ? user?.id ?? null : null}
            settingKey="receipt.footer"
            valueTemplate={{ line1: 'Terima kasih', line2: 'Follow @tokokue' }}
          />
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="card-title">UI Preferences</h2>
          <PreferenceToggles
            toggles={[
              { key: 'ui.preferences', path: 'darkMode', label: 'Dark Mode (User)', defaultValue: false, scope: 'USER' },
              { key: 'ui.preferences', path: 'compactTables', label: 'Compact Tables (User)', defaultValue: false, scope: 'USER' },
            ]}
          />
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="card-title">Backup &amp; Restore</h2>
          <BackupRestorePanel />
        </div>
      </div>

      {/* Current Settings Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 className="card-title" style={{ margin: 0 }}>Current Settings</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              className="select"
              value={query.scope ?? ''}
              onChange={(e) =>
                setQuery((q) => ({ ...q, scope: (e.target.value || null) as SettingScope | null, page: 1 }))
              }
            >
              <option value="">All Scopes</option>
              <option value="GLOBAL">GLOBAL</option>
              <option value="BRANCH">BRANCH</option>
              <option value="USER">USER</option>
            </select>

            <input
              className="input"
              style={{ width: 120 }}
              type="number"
              placeholder="Scope ID"
              value={query.scope_id ?? ''}
              onChange={(e) =>
                setQuery((q) => ({
                  ...q,
                  scope_id: e.target.value === '' ? null : Number(e.target.value),
                  page: 1,
                }))
              }
            />

            <select
              className="select"
              value={query.per_page ?? 10}
              onChange={(e) => setQuery((q) => ({ ...q, per_page: Number(e.target.value), page: 1 }))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="muted">Loading…</div>
        ) : err ? (
          <div className="badge badge-danger">{err}</div>
        ) : !rows || rows.data.length === 0 ? (
          <div className="muted">No settings found.</div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>ID</th>
                    <th>Scope</th>
                    <th>Scope ID</th>
                    <th>Key</th>
                    <th>Value</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.data.map((r) => (
                    <tr key={rowKey(r)}>
                      <td>{r.id}</td>
                      <td>{r.scope}</td>
                      <td>{r.scope_id ?? '-'}</td>
                      <td>{r.key}</td>
                      <td>
                        <code style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                          {JSON.stringify(r.value)}
                        </code>
                      </td>
                      <td>{new Date(r.updated_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <button
                className="button button-outline"
                disabled={!rows.prev_page_url}
                onClick={() => setQuery((q) => ({ ...q, page: Math.max(1, (q.page ?? 1) - 1) }))}
              >
                Prev
              </button>
              <span className="muted" style={{ fontSize: 12 }}>
                Page {rows.current_page} / {rows.last_page}
              </span>
              <button
                className="button button-outline"
                disabled={!rows.next_page_url}
                onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) + 1 }))}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
