import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

type DailyCount = { date: string; count: number };
type ActivityItem = {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  createdAt: string;
  subscription: { type: string; endsAt: string } | null;
};

type Stats = {
  totals: { total: number; active: number; pending: number; suspended: number };
  scans: { today: number; week: number };
  expiringSoon: number;
  newThisWeek: number;
  dailyScans: DailyCount[];
  recentActivity: ActivityItem[];
};

function MiniBar({ data }: { data: DailyCount[] }) {
  if (!data.length) return <p className="font-mono text-dim text-xs">// veri yok</p>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-10">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div
            className="w-full bg-emerge/40 group-hover:bg-emerge transition-colors rounded-sm"
            style={{ height: `${Math.max(2, (d.count / max) * 40)}px` }}
          />
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-bright bg-surface border border-border px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
            {d.date.slice(5)} — {d.count}
          </span>
        </div>
      ))}
    </div>
  );
}

function statColor(status: string) {
  if (status === 'ACTIVE') return 'text-emerge';
  if (status === 'PENDING') return 'text-warn';
  return 'text-danger';
}

function subBadge(item: ActivityItem) {
  if (!item.subscription) return <span className="text-dim">—</span>;
  const ends = new Date(item.subscription.endsAt).getTime();
  const now = Date.now();
  const days = Math.ceil((ends - now) / 86400000);
  if (days < 0) return <span className="text-danger font-mono text-xs">sona erdi</span>;
  if (days <= 7) return <span className="text-warn font-mono text-xs">{days}g</span>;
  return <span className="text-dim font-mono text-xs">{days}g</span>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="font-mono text-dim text-sm p-8">// yükleniyor...</p>;
  if (!stats) return <p className="font-mono text-danger text-sm p-8">// veri alınamadı</p>;

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-8">
      <h1 className="font-mono text-bright text-lg">dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'toplam', value: stats.totals.total, color: 'text-bright' },
          { label: 'aktif', value: stats.totals.active, color: 'text-emerge' },
          { label: 'bekliyor', value: stats.totals.pending, color: 'text-warn' },
          { label: 'askıda', value: stats.totals.suspended, color: 'text-danger' },
        ].map((c) => (
          <div key={c.label} className="bg-surface border border-border rounded-xl px-4 py-4">
            <p className="font-mono text-dim text-xs mb-1">{c.label}</p>
            <p className={`font-mono text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-xl px-4 py-4 space-y-3">
          <p className="font-mono text-dim text-xs uppercase tracking-widest">scan</p>
          <div className="flex gap-6">
            <div>
              <p className="font-mono text-dim text-xs">bugün</p>
              <p className="font-mono text-bright text-xl">{stats.scans.today}</p>
            </div>
            <div>
              <p className="font-mono text-dim text-xs">bu hafta</p>
              <p className="font-mono text-bright text-xl">{stats.scans.week}</p>
            </div>
          </div>
          <MiniBar data={stats.dailyScans} />
        </div>

        <div className="bg-surface border border-border rounded-xl px-4 py-4 space-y-3">
          <p className="font-mono text-dim text-xs uppercase tracking-widest">uyarılar</p>
          <div className="flex gap-6">
            <div>
              <p className="font-mono text-dim text-xs">7g içinde bitiyor</p>
              <p className={`font-mono text-xl ${stats.expiringSoon > 0 ? 'text-warn' : 'text-bright'}`}>
                {stats.expiringSoon}
              </p>
            </div>
            <div>
              <p className="font-mono text-dim text-xs">bu hafta yeni</p>
              <p className="font-mono text-bright text-xl">{stats.newThisWeek}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <p className="font-mono text-dim text-xs uppercase tracking-widest mb-3">son aktivite</p>
        <div className="flex flex-col gap-1.5">
          {stats.recentActivity.map((r) => (
            <Link
              key={r.id}
              to={`/restaurants/${r.id}`}
              className="bg-surface border border-border rounded-xl grid grid-cols-12 gap-3 px-4 py-3 items-center hover:border-emerge/30 transition-colors"
            >
              <div className="col-span-4">
                <p className="font-mono text-bright text-sm truncate">{r.name}</p>
                <p className="font-mono text-dim text-xs truncate">/{r.slug}</p>
              </div>
              <div className="col-span-2">
                <span className={`font-mono text-xs ${statColor(r.status)}`}>
                  {r.status.toLowerCase()}
                </span>
              </div>
              <div className="col-span-3">
                {r.subscription ? (
                  <span className="font-mono text-xs text-dim">
                    {r.subscription.type === 'TRIAL' ? 'trial' : 'annual'}
                    {' · '}{subBadge(r)}
                  </span>
                ) : (
                  <span className="font-mono text-xs text-dim">—</span>
                )}
              </div>
              <div className="col-span-3 text-right">
                <p className="font-mono text-dim text-xs">
                  {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
