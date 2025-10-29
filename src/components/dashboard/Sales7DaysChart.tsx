// src/components/dashboard/Sales7DaysChart.tsx
import type { Chart7DayPoint } from '../../types/dashboard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

type Props = {
  data: Chart7DayPoint[] | null;
  loading: boolean;
  error: string | null;
};

export default function Sales7DaysChart({ data, loading, error }: Props): React.ReactElement {
  if (loading) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div
          aria-hidden
          style={{
            height: 240,
            width: '100%',
            borderRadius: 12,
            background: 'rgba(0,0,0,0.05)',
            animation: 'pulse 1.2s ease-in-out infinite',
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-danger">Error</span>
          <span style={{ fontSize: 14 }}>{error}</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <span style={{ fontSize: 14, opacity: 0.7 }}>No data.</span>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Sales (Last 7 Days)</div>

      {/* Tinggi eksplisit agar Recharts stabil (menghindari width/height -1) */}
      <div style={{ height: 240, width: '100%', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            {/* orders = garis netral; revenue = warna brand */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="orders"
              dot={false}
              stroke="rgba(100,116,139,.9)"      // slate-ish, netral
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              dot={false}
              stroke="var(--color-primary)"      // #C04657 dari index.css
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
