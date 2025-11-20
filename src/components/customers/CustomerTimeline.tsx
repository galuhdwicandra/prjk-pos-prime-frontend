// src/components/customers/CustomerTimeline.tsx
import type { CustomerTimelineEvent } from '../../types/customers';

interface Props {
  items: CustomerTimelineEvent[];
  loading?: boolean;
  error?: string | null;
}

export default function CustomerTimeline({ items, loading, error }: Props) {
  if (loading) {
    return <div className="text-sm text-muted">Loading timeline…</div>;
  }
  if (error) {
    return <div className="text-sm text-danger">{error}</div>;
  }
  if (items.length === 0) {
    return <div className="text-sm text-muted">No timeline yet.</div>;
  }

  return (
    <ol
      className="mt-2"
      style={{
        borderLeft: '1px solid var(--border)',
        paddingLeft: 12,
      }}
    >
      {items.map((ev) => (
        <li key={ev.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span
              aria-hidden
              style={{
                marginTop: 2,
                width: 8,
                height: 8,
                borderRadius: 9999,
                background: 'var(--muted-foreground)',
                flex: '0 0 auto',
              }}
            />
            <div>
              <div
                className="text-xs"
                style={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}
              >
                {ev.event_type}
              </div>

              {ev.title ? <div style={{ fontWeight: 600 }}>{ev.title}</div> : null}

              {ev.note ? <div className="text-sm">{ev.note}</div> : null}

              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {new Date(ev.happened_at).toLocaleString()}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
