import { useEffect, useState } from 'react';
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

function ScanChart({ data }: { data: DailyScan[] }) {
  const W = 600;
  const H = 120;
  const PAD = { top: 12, right: 8, bottom: 28, left: 32 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const max = Math.max(...data.map((d) => d.count), 1);
  const step = innerW / (data.length - 1);

  const px = (i: number) => PAD.left + i * step;
  const py = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const polyline = data.map((d, i) => `${px(i)},${py(d.count)}`).join(' ');
  const area = [
    `${px(0)},${PAD.top + innerH}`,
    ...data.map((d, i) => `${px(i)},${py(d.count)}`),
    `${px(data.length - 1)},${PAD.top + innerH}`,
  ].join(' ');

  // Y axis labels
  const yLabels = [0, Math.round(max / 2), max];

  // X axis: show first, middle, last date labels
  const xLabels = [0, Math.floor(data.length / 2), data.length - 1].map((i) => ({
    i,
    label: new Date(data[i].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8b84b" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#e8b84b" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLabels.map((v) => (
        <line
          key={v}
          x1={PAD.left}
          x2={W - PAD.right}
          y1={py(v)}
          y2={py(v)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}

      {/* Y axis labels */}
      {yLabels.map((v) => (
        <text
          key={v}
          x={PAD.left - 6}
          y={py(v) + 4}
          textAnchor="end"
          fontSize="9"
          fill="rgba(255,255,255,0.3)"
          fontFamily="monospace"
        >
          {v}
        </text>
      ))}

      {/* X axis labels */}
      {xLabels.map(({ i, label }) => (
        <text
          key={i}
          x={px(i)}
          y={H - 4}
          textAnchor="middle"
          fontSize="9"
          fill="rgba(255,255,255,0.3)"
          fontFamily="monospace"
        >
          {label}
        </text>
      ))}

      {/* Area fill */}
      <polygon points={area} fill="url(#chartFill)" />

      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#e8b84b"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data points — only show for non-zero or hovered (just render all small) */}
      {data.map((d, i) =>
        d.count > 0 ? (
          <circle key={i} cx={px(i)} cy={py(d.count)} r="2.5" fill="#e8b84b" />
        ) : null,
      )}
    </svg>
  );
}

export default function DashboardPage() {
  const { restaurant } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get('/restaurant/stats').then(setStats).catch(() => {});
  }, []);

  const isActive = restaurant?.status === 'ACTIVE';
  const subEnds = restaurant?.subscription
    ? new Date(restaurant.subscription.endsAt)
    : null;
  const now = Date.now();
  const subExpired = subEnds ? subEnds.getTime() < now : false;
  const daysLeft = subEnds
    ? Math.max(0, Math.ceil((subEnds.getTime() - now) / 86400000))
    : 0;
  const expiringSoon = !subExpired && daysLeft <= 7 && daysLeft > 0;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-snow font-semibold">
          Hosgeldiniz, {restaurant?.name}
        </h1>
        <p className="font-body text-silver text-sm mt-1">
          Restoran panelinize genel bakis
        </p>
      </div>

      {/* Status banner */}
      {!isActive && (
        <div className="mb-6 px-5 py-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <p className="font-body text-yellow-400 text-sm">
            Hesabiniz henuz admin tarafindan onaylanmamis. Onay sonrasi tum ozelliklere erisebilirsiniz.
          </p>
        </div>
      )}

      {/* Subscription expired banner */}
      {isActive && subExpired && (
        <div className="mb-6 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-body text-red-400 text-sm">
            Aboneliginiz sona erdi. Musterileriniz menunuze erisemiyor. Yenilemek icin bizimle iletisime gecin.
          </p>
        </div>
      )}

      {/* Expiring soon banner */}
      {isActive && expiringSoon && (
        <div className="mb-6 px-5 py-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-orange-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          </svg>
          <p className="font-body text-orange-400 text-sm">
            Aboneliginiz <span className="font-semibold">{daysLeft} gun</span> sonra sona eriyor. Kesintisiz hizmet icin yenileyin.
          </p>
        </div>
      )}

      {/* Subscription card */}
      {isActive && restaurant?.subscription && (
        <div className={`mb-6 px-5 py-4 rounded-xl flex items-center justify-between border ${
          subExpired
            ? 'bg-red-500/6 border-red-500/15'
            : expiringSoon
            ? 'bg-orange-500/6 border-orange-500/15'
            : 'bg-gold/6 border-gold/15'
        }`}>
          <div>
            <p className="font-body text-xs text-silver uppercase tracking-widest">Abonelik</p>
            <p className={`font-display font-medium mt-0.5 ${subExpired ? 'text-red-400' : expiringSoon ? 'text-orange-400' : 'text-gold'}`}>
              {restaurant.subscription.type === 'TRIAL' ? 'Deneme' : 'Yillik'}
            </p>
          </div>
          <div className="text-right">
            <p className={`font-display text-2xl font-semibold ${subExpired ? 'text-red-400' : expiringSoon ? 'text-orange-400' : 'text-snow'}`}>
              {subExpired ? 'Sona erdi' : daysLeft}
            </p>
            {!subExpired && <p className="font-body text-xs text-silver">gun kaldi</p>}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Toplam Tarama', value: stats?.totalScans ?? '—' },
          { label: 'Son 30 Gun', value: stats?.recentScans ?? '—' },
          { label: 'Kategori', value: stats?.categoryCount ?? '—' },
          { label: 'Urun', value: stats?.productCount ?? '—' },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-6">
            <p className="font-body text-xs text-silver uppercase tracking-widest">{s.label}</p>
            <p className="font-display text-3xl text-snow font-semibold mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Scan chart */}
      {stats?.dailyScans && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-body text-xs text-silver uppercase tracking-widest">Gunluk Taramalar</p>
            <p className="font-body text-xs text-silver">Son 30 gun</p>
          </div>
          {stats.dailyScans.every((d) => d.count === 0) ? (
            <div className="flex items-center justify-center py-10">
              <p className="font-body text-silver text-sm">Henuz tarama verisi yok.</p>
            </div>
          ) : (
            <ScanChart data={stats.dailyScans} />
          )}
        </div>
      )}
    </div>
  );
}
