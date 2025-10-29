// src/components/settings/PreferenceToggles.tsx
import { useState } from 'react';
import type { SettingUpsertPayload, SettingScope } from '../../types/settings';
import { upsertSetting } from '../../api/settings';
import { useAuth } from '../../store/auth';

interface ToggleDef {
  key: string;         // e.g., 'ui.preferences'
  path: string;        // dot path inside JSON, e.g., 'darkMode'
  label: string;       // UI label
  defaultValue: boolean;
  scope: SettingScope; // USER by default
}

interface Props {
  toggles: ToggleDef[];
  scopeId?: number | null;
}

export default function PreferenceToggles({ toggles, scopeId = null }: Props) {
  const { user } = useAuth();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<'ok' | 'err' | null>(null);

  async function toggle(t: ToggleDef, nextVal: boolean) {
    setMsg(null);
    setMsgType(null);
    try {
      const k = `${t.key}:${t.path}`;
      setBusyKey(k);
      const payload: SettingUpsertPayload = {
        scope: t.scope,
        scope_id: t.scope === 'USER' ? user?.id ?? scopeId ?? null : scopeId ?? null,
        key: t.key,
        value: { [t.path]: nextVal },
      };
      await upsertSetting(payload);
      setMsg('Preference saved.');
      setMsgType('ok');
    } catch {
      setMsg('Failed to save preference.');
      setMsgType('err');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {toggles.map((t) => {
        const id = `${t.key}-${t.path}`;
        const loading = busyKey === `${t.key}:${t.path}`;
        return (
          <label
            key={id}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              margin: 0,
            }}
          >
            <span>{t.label}</span>
            <input
              type="checkbox"
              disabled={loading}
              defaultChecked={t.defaultValue}
              onChange={(e) => toggle(t, e.target.checked)}
              aria-label={t.label}
            />
          </label>
        );
      })}

      {msg ? (
        <div>
          <span
            className={`badge ${msgType === 'ok' ? 'badge-success' : msgType === 'err' ? 'badge-danger' : ''}`}
          >
            {msg}
          </span>
        </div>
      ) : null}
    </div>
  );
}
