// src/components/dashboard/QuickActions.tsx
import type { QuickAction } from "../../types/dashboard";

type Props = {
    data: QuickAction[] | null;
    loading: boolean;
    error: string | null;
    onRun?: (action: QuickAction) => void;
};

export default function QuickActions({ data, loading, error, onRun }: Props): React.ReactElement {
    const hasData = !!data && data.length > 0;

    return (
        <div className="card">
            <div style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Quick Actions</div>
            </div>

            <div style={{ padding: 12 }}>
                {loading && (
                    <div
                        aria-hidden
                        style={{
                            height: 48,
                            borderRadius: 8,
                            background: "rgba(0,0,0,.06)",
                            boxShadow: "inset 0 1px 2px rgba(0,0,0,.06)",
                        }}
                    />
                )}

                {!loading && error && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="badge badge-danger">Error</span>
                        <span style={{ fontSize: 14 }}>{error}</span>
                    </div>
                )}

                {!loading && !error && !hasData && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="badge badge-warning">Info</span>
                        <span style={{ opacity: 0.8, fontSize: 14 }}>Tidak ada saran tindakan.</span>
                    </div>
                )}

                {!loading && !error && hasData && (
                    <ul
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            listStyle: "none",
                            padding: 0,
                            margin: 0,
                        }}
                    >
                        {data!.map((a, idx) => {
                            const title =
                                a.type === "LOW_STOCK" && a.payload
                                    ? `First SKU ${a.payload.first_sku ?? ""}`
                                    : a.type;

                            const label =
                                a.type === "LOW_STOCK" && a.payload
                                    ? `${a.label} (${a.payload.count})`
                                    : a.label;

                            return (
                                <li key={`${a.type}-${idx}`}>
                                    <button
                                        type="button"
                                        className="button button-outline"
                                        style={{ padding: "6px 10px", fontSize: 12 }}
                                        onClick={() => onRun?.(a)}
                                        title={title}
                                    >
                                        {label}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
