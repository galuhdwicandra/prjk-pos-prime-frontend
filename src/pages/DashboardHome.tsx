// src/pages/DashboardHome.tsx
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../store/auth';
import { getKPIs, getChart7d, getTopProducts, getLowStock, getQuickActions } from '../api/dashboard';
import type { KPIs, Chart7DayPoint, TopProduct, LowStockRow, QuickAction } from '../types/dashboard';
import KPIStatCards from '../components/dashboard/KPIStatCards';
import Sales7DaysChart from '../components/dashboard/Sales7DaysChart';
import TopProductsList from '../components/dashboard/TopProductsList';
import LowStockList from '../components/dashboard/LowStockList';
import QuickActions from '../components/dashboard/QuickActions';

export default function DashboardHome(): React.ReactElement {
  const { user, hasRole } = useAuth();

  const branchId = user?.cabang_id ?? null;
  const isSuperadmin = hasRole('superadmin');
  const effectiveCabangId = useMemo(
    () => (isSuperadmin ? (branchId ?? undefined) : (user?.cabang_id ?? undefined)),
    [isSuperadmin, branchId, user?.cabang_id]
  );

  const canView = useMemo(() => hasRole('superadmin', 'admin_cabang', 'kasir'), [hasRole]);

  const [kpi, setKpi] = useState<KPIs | null>(null);
  const [chart, setChart] = useState<Chart7DayPoint[] | null>(null);
  const [top, setTop] = useState<TopProduct[] | null>(null);
  const [low, setLow] = useState<LowStockRow[] | null>(null);
  const [acts, setActs] = useState<QuickAction[] | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  // ====== Layout responsif (tanpa Tailwind) ======
  const [isWide, setIsWide] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth >= 1200);
  useEffect(() => {
    const onResize = (): void => setIsWide(window.innerWidth >= 1200);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      if (!canView) return;
      setLoading(true);
      setErr(null);

      try {
        const now = new Date();
        const to = new Date(now); to.setHours(23, 59, 59, 999);
        const from = new Date(now); from.setDate(now.getDate() - 6); from.setHours(0, 0, 0, 0);

        const [k, c, t, l, a] = await Promise.all([
          getKPIs({ cabang_id: effectiveCabangId, from: from.toISOString(), to: to.toISOString() }),
          getChart7d({ cabang_id: effectiveCabangId }),
          getTopProducts({ cabang_id: effectiveCabangId, limit: 5 }),
          getLowStock({ cabang_id: effectiveCabangId }),
          getQuickActions({ cabang_id: effectiveCabangId }),
        ]);

        if (!cancelled) {
          setKpi(k); setChart(c); setTop(t); setLow(l); setActs(a);
        }
      } catch (e) {
        if (!cancelled) {
          const anyErr = e as { response?: { status?: number; data?: unknown } };
          const serverMsg =
            anyErr?.response?.data &&
            typeof anyErr.response.data === 'object' &&
            (anyErr.response.data as Record<string, unknown>)?.message;
          const msg =
            anyErr?.response?.status === 403
              ? (typeof serverMsg === 'string'
                  ? `403 Forbidden — ${serverMsg}`
                  : '403 Forbidden — Policy backend menolak akses.')
              : (e instanceof Error ? e.message : 'Failed to load dashboard');
          setErr(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [effectiveCabangId, canView]);

  // ====== Guard ======
  if (!canView) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span className="badge badge-warning">Akses</span>
          <div style={{ opacity: 0.85 }}>You don’t have permission to view the dashboard.</div>
        </div>
      </div>
    );
  }

  if (!isSuperadmin && !user?.cabang_id) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span className="badge badge-warning">Perlu Tindakan</span>
          <div style={{ opacity: 0.95 }}>
            Akun Anda belum terikat ke cabang. Hubungi admin pusat.
          </div>
        </div>
      </div>
    );
  }

  // ====== UI ======
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1280, margin: '0 auto' }}>
      {/* Header halaman */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Dashboard</div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '.01em', color: '#1f2937' }}>
            Ringkasan aktivitas & performa toko
          </h1>
        </div>
        {/* ruang kosong kanan (slot search/role switch jika sudah ada di topbar) */}
        <div />
      </div>

      {/* KPI baris pertama (komponen sudah menata card di dalam) */}
      <KPIStatCards data={kpi} loading={loading} error={err} />

      {/* Grid utama: Kiri (Chart) — Kanan (List) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isWide ? '2fr 1fr' : '1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* Kiri: Chart 7 hari */}
        <section className="card" style={{ padding: 18, minWidth: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 10, color: '#111827' }}>Trend Penjualan Mingguan</div>
          <div style={{ borderTop: '1px solid rgba(0,0,0,.06)', marginTop: 8, paddingTop: 12 }}>
            <Sales7DaysChart data={chart} loading={loading} error={err} />
          </div>
        </section>

        {/* Kanan: dua kartu vertikal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <section className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 600, marginBottom: 10, color: '#111827' }}>Produk Terlaris</div>
            <div style={{ borderTop: '1px solid rgba(0,0,0,.06)', marginTop: 8, paddingTop: 12 }}>
              <TopProductsList data={top} loading={loading} error={err} />
            </div>
          </section>

          <section className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 600, marginBottom: 10, color: '#111827' }}>Stok Rendah</div>
            <div style={{ borderTop: '1px solid rgba(0,0,0,.06)', marginTop: 8, paddingTop: 12 }}>
              <LowStockList data={low} loading={loading} error={err} />
            </div>
          </section>
        </div>
      </div>

      {/* Alert bar tipis (opsional, meniru “Peringatan Stok Rendah” di bagian bawah gambar) */}
      {Array.isArray(low) && low.length > 0 && (
        <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-warning">Peringatan</span>
          <div style={{ fontSize: 14, color: '#374151' }}>
            Peringatan stok rendah pada {low.length} item. Periksa kartu <strong>Stok Rendah</strong> di kanan.
          </div>
        </div>
      )}

      {/* Quick actions */}
      <section className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, color: '#111827' }}>Tindakan Cepat</div>
        <div style={{ borderTop: '1px solid rgba(0,0,0,.06)', marginTop: 8, paddingTop: 12 }}>
          <QuickActions
            data={acts}
            loading={loading}
            error={err}
            onRun={(a) => {
              // logic tetap asli; tidak ada dummy data
              if (a.type === 'LOW_STOCK') alert(`Low stock count: ${a.payload?.count ?? 0}`);
              if (a.type === 'PAYMENT_CHECK') alert('Buka daftar pembayaran untuk cek transaksi PENDING/FAILED.');
            }}
          />
        </div>
      </section>
    </div>
  );
}
