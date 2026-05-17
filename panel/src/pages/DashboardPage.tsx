import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

type DailyScan = { date: string; count: number };
type Stats = {
  totalScans: number;
  recentScans: number;
  categoryCount: number;
  productCount: number;
  dailyScans: DailyScan[];
};

/* ── Smooth area chart ── */
function ScanChart({ data }: { data: DailyScan[] }) {
  if (data.length < 2) return null;

  const W = 800;
  const H = 160;
  const PAD = { top: 16, right: 16, bottom: 32, left: 40 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  const max = Math.max(...data.map(d => d.count), 1);
  const px = (i: number) => PAD.left + (i / (data.length - 1)) * iW;
  const py = (v: number) => PAD.top + iH - (v / max) * iH;

  // Smooth bezier path
  const points = data.map((d, i) => [px(i), py(d.count)] as [number, number]);
  const pathD = points.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px0, py0] = points[i - 1];
    const cpx = (px0 + x) / 2;
    return `${acc} C ${cpx} ${py0} ${cpx} ${y} ${x} ${y}`;
  }, '');
  const areaD = `${pathD} L ${points[points.length - 1][0]} ${PAD.top + iH} L ${points[0][0]} ${PAD.top + iH} Z`;

  // X axis labels: 5 evenly spaced
  const xLabels = [0, 7, 14, 21, 29].map(i => ({
    i,
    label: new Date(data[i]?.date ?? '').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
    x: px(i),
  }));

  // Y axis
  const yLabels = [0, Math.round(max / 2), max];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {yLabels.map(v => (
        <line key={v} x1={PAD.left} x2={W - PAD.right} y1={py(v)} y2={py(v)}
          stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
      ))}

      {/* Y labels */}
      {yLabels.map(v => (
        <text key={v} x={PAD.left - 6} y={py(v) + 4} textAnchor="end"
          fontSize="10" fill="#9ca3af" fontFamily="inherit">{v}</text>
      ))}

      {/* X labels */}
      {xLabels.map(({ i, label, x }) => (
        <text key={i} x={x} y={H - 6} textAnchor="middle"
          fontSize="10" fill="#9ca3af" fontFamily="inherit">{label}</text>
      ))}

      {/* Area */}
      <path d={areaD} fill="url(#areaGrad)" />

      {/* Line */}
      <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots on non-zero */}
      {data.map((d, i) => d.count > 0 ? (
        <circle key={i} cx={px(i)} cy={py(d.count)} r="3" fill="#6366f1" />
      ) : null)}
    </svg>
  );
}

/* ── Stat card ── */
function StatCard({ label, value, icon, color }: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex items-start justify-between gap-3">
      <div>
        <p className="font-body text-sm text-silver mb-1">{label}</p>
        <p className="font-display text-3xl font-bold text-snow">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
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

  const hasData = stats?.dailyScans.some(d => d.count > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-snow">Genel Bakış</h1>
        <p className="font-body text-sm text-silver mt-0.5">
          {restaurant?.name} — menü istatistikleri
        </p>
      </div>

      {/* Banners */}
      {!isActive && (
        <div className="flex items-center gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-body text-sm text-amber-700">Hesabınız henüz admin tarafından onaylanmadı.</p>
        </div>
      )}
      {isActive && subExpired && (
        <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-body text-sm text-red-700">Aboneliğiniz sona erdi. Müşteriler menünüze erişemiyor.</p>
        </div>
      )}
      {isActive && expiringSoon && (
        <div className="flex items-center gap-3 px-4 py-3.5 bg-orange-50 border border-orange-200 rounded-xl">
          <svg className="w-5 h-5 text-orange-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          </svg>
          <p className="font-body text-sm text-orange-700">
            Aboneliğiniz <span className="font-semibold">{daysLeft} gün</span> sonra sona eriyor.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Toplam Tarama"
          value={stats?.totalScans ?? '—'}
          icon="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          color="bg-indigo-50 text-gold"
        />
        <StatCard
          label="Son 30 Gün"
          value={stats?.recentScans ?? '—'}
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          color="bg-purple-50 text-purple-500"
        />
        <StatCard
          label="Kategoriler"
          value={stats?.categoryCount ?? '—'}
          icon="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
          color="bg-green-50 text-green-500"
        />
        <StatCard
          label="Ürünler"
          value={stats?.productCount ?? '—'}
          icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          color="bg-amber-50 text-amber-500"
        />
      </div>

      {/* Chart */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-body font-semibold text-snow">Günlük Taramalar</p>
            <p className="font-body text-xs text-silver mt-0.5">Son 30 gün</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gold inline-block" />
            <span className="font-body text-xs text-silver">Tarama</span>
          </div>
        </div>
        {hasData ? (
          <ScanChart data={stats!.dailyScans} />
        ) : (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <svg className="w-10 h-10 text-border" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="font-body text-sm text-silver">Henüz tarama verisi yok</p>
            <p className="font-body text-xs text-silver/60">QR kodunuz tarandığında burada görünecek</p>
          </div>
        )}
      </div>

      {/* Bottom row: subscription + quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Subscription card */}
        {restaurant?.subscription && (
          <div className="bg-surface border border-border rounded-2xl p-5">
            <p className="font-body text-xs font-semibold text-silver uppercase tracking-widest mb-4">Abonelik</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body font-semibold text-snow">
                  {restaurant.subscription.type === 'TRIAL' ? 'Deneme Paketi' : 'Yıllık Paket'}
                </p>
                <p className="font-body text-sm text-silver mt-1">
                  {subExpired
                    ? 'Sona erdi'
                    : `${new Date(restaurant.subscription.endsAt).toLocaleDateString('tr-TR')} tarihine kadar aktif`}
                </p>
              </div>
              <div className={`px-3 py-1.5 rounded-lg font-body text-sm font-semibold ${
                subExpired ? 'bg-red-50 text-red-600' :
                expiringSoon ? 'bg-orange-50 text-orange-600' :
                'bg-indigo-50 text-gold'
              }`}>
                {subExpired ? 'Sona Erdi' : `${daysLeft} gün`}
              </div>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="font-body text-xs font-semibold text-silver uppercase tracking-widest mb-4">Hızlı Erişim</p>
          <div className="flex flex-col gap-1">
            {[
              { to: '/categories', label: 'Kategori ekle veya düzenle', d: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
              { to: '/products',   label: 'Ürünleri yönet',             d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
              { to: '/design',     label: 'Menü teması değiştir',       d: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { to: '/qr-code',    label: 'QR kodunu indir',            d: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-elevated transition-colors group"
              >
                <svg className="w-4 h-4 text-silver group-hover:text-gold transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.d} />
                </svg>
                <span className="font-body text-sm text-silver group-hover:text-snow transition-colors">{item.label}</span>
                <svg className="w-3.5 h-3.5 text-silver/30 group-hover:text-silver ml-auto transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
