// src/components/settings/SettingsForm.tsx
import { useMemo, useState } from 'react';
import type { Setting, SettingScope, SettingUpsertPayload } from '../../types/settings';
import { upsertSetting } from '../../api/settings';
import { useAuth } from '../../store/auth';

interface Props {
  initial?: Setting | null;
  defaultScope: SettingScope;
  defaultScopeId?: number | null;
  /** Which key are we editing (e.g., 'numbering.invoice', 'receipt.footer', 'tax.rules') */
  settingKey: string;
  /** Optional hint of fields for the JSON value editor */
  valueTemplate?: Record<string, unknown>;
  onSaved?: (saved: Setting) => void;
  disabled?: boolean;
}

export default function SettingsForm({
  initial = null,
  defaultScope,
  defaultScopeId = null,
  settingKey,
  valueTemplate,
  onSaved,
  disabled = false,
}: Props) {
  const { hasRole, user } = useAuth();
  const canEditGlobal = hasRole('superadmin');
  const canEditBranch = hasRole('superadmin', 'admin_cabang');
  const canEditUser = true; // everyone can edit USER-scoped prefs for themselves

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [scope, setScope] = useState<SettingScope>(initial?.scope ?? defaultScope);
  const [scopeId, setScopeId] = useState<number | null>(
    initial?.scope_id ?? defaultScopeId ?? (scope === 'USER' ? user?.id ?? null : null),
  );
  const [value, setValue] = useState<Record<string, unknown>>(
    (initial?.value as Record<string, unknown>) ?? valueTemplate ?? {},
  );

  const scopeDisabled = useMemo(() => {
    if (scope === 'GLOBAL') return !canEditGlobal || disabled;
    if (scope === 'BRANCH') return !canEditBranch || disabled;
    return !canEditUser || disabled;
  }, [scope, canEditGlobal, canEditBranch, canEditUser, disabled]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      setSaving(true);
      const payload: SettingUpsertPayload = {
        scope,
        scope_id: scope === 'USER' ? user?.id ?? scopeId ?? null : scopeId ?? null,
        key: settingKey,
        value,
      };
      const saved = await upsertSetting(payload);
      setMessage('Setting saved.');
      onSaved?.(saved);
    } catch {
      setMessage('Failed to save setting.');
    } finally {
      setSaving(false);
    }
  }

  const isSuccess = message === 'Setting saved.';
  const isError = message === 'Failed to save setting.';

  return (
    <form onSubmit={handleSubmit}>
      {/* 3-column form row (mobile first) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 12,
          marginBottom: 12,
        }}
      >
        {/* upgrade to 3 cols on wider screens via a small inline query-free trick */}
        <div style={{ display: 'contents' as const }}>
          <label>
            <div className="card-title" style={{ fontSize: 12 }}>Scope</div>
            <select
              value={scope}
              onChange={(ev) => setScope(ev.target.value as SettingScope)}
              disabled={scopeDisabled}
              className="select"
              aria-label="Setting Scope"
            >
              <option value="GLOBAL">GLOBAL</option>
              <option value="BRANCH">BRANCH</option>
              <option value="USER">USER</option>
            </select>
          </label>

          <label>
            <div className="card-title" style={{ fontSize: 12 }}>Scope ID</div>
            <input
              type="number"
              value={scopeId ?? ''}
              onChange={(e) => setScopeId(e.target.value === '' ? null : Number(e.target.value))}
              disabled={scope === 'GLOBAL' || scopeDisabled}
              className="input"
              placeholder={scope === 'USER' ? 'User ID (auto)' : 'Branch ID'}
              aria-label="Scope ID"
            />
          </label>

          <label>
            <div className="card-title" style={{ fontSize: 12 }}>Key</div>
            <input
              type="text"
              value={settingKey}
              readOnly
              className="input"
              aria-label="Setting Key"
            />
          </label>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div className="card-title" style={{ fontSize: 12 }}>Value (JSON)</div>
        <textarea
          className="textarea"
          rows={8}
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              const next = JSON.parse(e.target.value) as Record<string, unknown>;
              setValue(next);
              if (isError) setMessage(null);
            } catch {
              // keep last valid state; submission still requires valid JSON
            }
          }}
          aria-label="Setting JSON Value"
        />
        <p className="muted" style={{ marginTop: 6, fontSize: 12 }}>
          Edit as JSON. Must be valid to submit.
        </p>
      </div>

      {message ? (
        <div
          className={isSuccess ? 'badge badge-success' : isError ? 'badge badge-danger' : 'muted'}
          style={{ marginBottom: 8 }}
        >
          {message}
        </div>
      ) : null}

      <div>
        <button type="submit" disabled={saving || disabled} className="button button-primary">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
