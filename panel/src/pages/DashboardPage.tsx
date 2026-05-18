import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

type DailyScan = { date: string; count: number };
type Stats = {
  todayScans: number;
  weekScans: number;
  lastWeekScans: number;
  monthScans: number;
  ninetyDayScans: number;
  categoryCount: number;
  productCount: number;
  activeAnnouncementCount: number;
  dailyScans: DailyScan[];
};

/* ── Custom tooltip for chart ── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="font-body text-xs text-silver mb-1">
        {new Date(label).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
      </p>
      <p className="font-display text-snow font-semibold text-sm">
        {payload[0].value} görüntüleme
      </p>
    </div>
  );
}

/* ── Top stat card ── */
function StatCard({ label, value, sub, subColor }: {
  label: string; value: number | string; sub?: string; subColor?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        {sub && <span className={`font-body text-xs font-bold px-2 py-0.5 rounded-full ${subColor}`}>{sub}</span>}
      </div>
      <p className="font-display text-3xl font-bold text-snow tracking-tight">{value}</p>
      <p className="font-body text-sm text-silver mt-1">{label}</p>
    </div>
  );
}

/* ── Overview item ── */
function OverviewItem({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-border/50 last:border-0">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <span className="font-body text-sm text-silver flex-1">{label}</span>
      <span className="font-display text-xl font-bold text-snow">{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { restaurant } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get('/restaurant/stats').then(setStats).catch(() => {});
  }, []);

  const isActive = restaurant?.status === 'ACTIVE';
  const subEnds = restaurant?.subscription ? new Date(restaurant.subscription.endsAt) : null;
  const now = Date.now();
  const subExpired = subEnds ? subEnds.getTime() < now : false;
  const daysLeft = subEnds ? Math.max(0, Math.ceil((subEnds.getTime() - now) / 86400000)) : 0;
  const expiringSoon = !subExpired && daysLeft <= 7 && daysLeft > 0;

  const weekChange = stats && stats.lastWeekScans > 0
    ? Math.round(((stats.weekScans - stats.lastWeekScans) / stats.lastWeekScans) * 100)
    : null;
  const weekSub = weekChange !== null ? `${weekChange >= 0 ? '+' : ''}${weekChange}%` : undefined;
  const weekSubColor = weekChange !== null
    ? weekChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
    : '';

  const daily = stats?.dailyScans ?? [];
  const total14 = daily.reduce((s, d) => s + d.count, 0);
  const avg14 = daily.length ? Math.round((total14 / daily.length) * 10) / 10 : 0;
  const best = daily.reduce((a, b) => b.count > a.count ? b : a, daily[0] ?? { date: '', count: 0 });
  const worst = daily.reduce((a, b) => b.count < a.count ? b : a, daily[0] ?? { date: '', count: 0 });
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '';

  const chartData = daily.map((d) => ({
    date: d.date,
    label: new Date(d.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
    count: d.count,
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Banners */}
      {!isActive && (
        <div className="flex items-center gap-3 px-4 py-3.5 bg-amber-950/40 border border-amber-700/40 rounded-xl">
          <svg className="w-4 h-4 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="font-body text-sm text-amber-300">Hesabınız henüz admin tarafından onaylanmadı.</p>
        </div>
      )}
      {isActive && subExpired && (
        <div className="flex items-center gap-3 px-4 py-3.5 bg-red-950/40 border border-red-700/40 rounded-xl">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="font-body text-sm text-red-300">Aboneliğiniz sona erdi. Müşteriler menünüze erişemiyor.</p>
        </div>
      )}
      {isActive && expiringSoon && (
        <div className="flex items-center gap-3 px-4 py-3.5 bg-orange-950/40 border border-orange-700/40 rounded-xl">
          <svg className="w-4 h-4 text-orange-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" /></svg>
          <p className="font-body text-sm text-orange-300">Aboneliğiniz <span className="font-semibold">{daysLeft} gün</span> sonra sona eriyor.</p>
        </div>
      )}

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Bugün" value={stats?.todayScans ?? '—'} />
        <StatCard label="Bu Hafta" value={stats?.weekScans ?? '—'} sub={weekSub} subColor={weekSubColor} />
        <StatCard label="Bu Ay" value={stats?.monthScans ?? '—'} />
        <StatCard label="90 Günlük" value={stats?.ninetyDayScans ?? '—'} />
      </div>

      {/* Chart */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-display font-semibold text-snow">Menü Görüntülemeleri</p>
            <p className="font-body text-xs text-silver mt-0.5">Son 14 Gün</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
            <span className="font-body text-xs text-silver">Görüntüleme</span>
          </div>
        </div>

        {total14 > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'inherit' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'inherit' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(124,58,237,0.3)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  fill="url(#scanGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#7c3aed', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Stats bar */}
            <div className="flex items-center gap-5 mt-5 pt-4 border-t border-border flex-wrap">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-silver/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <span className="font-body text-xs text-silver">Ort: <span className="text-snow font-semibold">{avg14}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 15l7-7 7 7" /></svg>
                <span className="font-body text-xs text-silver">En iyi: <span className="text-snow font-semibold">{best.count}</span> <span className="text-silver/50">({fmtDate(best.date)})</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7" /></svg>
                <span className="font-body text-xs text-silver">En düşük: <span className="text-snow font-semibold">{worst.count}</span> <span className="text-silver/50">({fmtDate(worst.date)})</span></span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <svg className="w-3.5 h-3.5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                <span className="font-body text-xs text-silver">Toplam: <span className="text-snow font-semibold">{total14}</span></span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <svg className="w-10 h-10 text-border" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="font-body text-sm text-silver">Henüz görüntüleme verisi yok</p>
            <p className="font-body text-xs text-silver/50">QR kodunuz tarandığında burada görünecek</p>
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Genel Bakış */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="font-body text-xs font-semibold text-silver uppercase tracking-widest mb-1">Genel Bakış</p>
          <OverviewItem
            label="Ürünler"
            value={stats?.productCount ?? 0}
            color="bg-orange-500/10 text-orange-400"
            icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          />
          <OverviewItem
            label="Kategoriler"
            value={stats?.categoryCount ?? 0}
            color="bg-blue-500/10 text-blue-400"
            icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>}
          />
          <OverviewItem
            label="Aktif Duyurular"
            value={stats?.activeAnnouncementCount ?? 0}
            color="bg-pink-500/10 text-pink-400"
            icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
          />
        </div>

        {/* Abonelik + Hızlı Erişim */}
        <div className="flex flex-col gap-4">
          {restaurant?.subscription && (
            <div className="bg-surface border border-border rounded-2xl p-5">
              <p className="font-body text-xs font-semibold text-silver uppercase tracking-widest mb-3">Abonelik</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body font-semibold text-snow text-sm">
                    {restaurant.subscription.type === 'TRIAL' ? 'Deneme Paketi' : 'Yıllık Paket'}
                  </p>
                  <p className="font-body text-xs text-silver mt-0.5">
                    {subExpired ? 'Sona erdi' : `${new Date(restaurant.subscription.endsAt).toLocaleDateString('tr-TR')} tarihine kadar aktif`}
                  </p>
                </div>
                <div className={`px-3 py-1.5 rounded-lg font-display text-sm font-bold ${
                  subExpired ? 'bg-red-500/10 text-red-400' :
                  expiringSoon ? 'bg-orange-500/10 text-orange-400' :
                  'bg-violet-500/10 text-violet-400'
                }`}>
                  {subExpired ? 'Sona Erdi' : `${daysLeft} gün`}
                </div>
              </div>
            </div>
          )}

          <div className="bg-surface border border-border rounded-2xl p-5 flex-1">
            <p className="font-body text-xs font-semibold text-silver uppercase tracking-widest mb-2">Hızlı Erişim</p>
            <div className="flex flex-col gap-0.5">
              {[
                { to: '/categories',    label: 'Kategorileri düzenle',  d: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
                { to: '/products',      label: 'Ürünleri yönet',        d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
                { to: '/announcements', label: 'Duyuru ekle',           d: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
                { to: '/qr-code',       label: 'QR kodunu indir',       d: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
              ].map((item) => (
                <Link key={item.to} to={item.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-elevated transition-colors group"
                >
                  <svg className="w-4 h-4 text-silver/50 group-hover:text-violet-400 transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.d} />
                  </svg>
                  <span className="font-body text-sm text-silver group-hover:text-snow transition-colors">{item.label}</span>
                  <svg className="w-3.5 h-3.5 text-silver/20 group-hover:text-silver/50 ml-auto transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
