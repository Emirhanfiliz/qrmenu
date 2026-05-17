import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

type Stats = {
  totalScans: number;
  recentScans: number;
  categoryCount: number;
  productCount: number;
};

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
  const daysLeft = subEnds
    ? Math.max(0, Math.ceil((subEnds.getTime() - Date.now()) / 86400000))
    : 0;

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

      {/* Subscription */}
      {isActive && restaurant?.subscription && (
        <div className="mb-6 px-5 py-4 bg-gold/6 border border-gold/15 rounded-xl flex items-center justify-between">
          <div>
            <p className="font-body text-xs text-silver uppercase tracking-widest">Abonelik</p>
            <p className="font-display text-gold font-medium mt-0.5">
              {restaurant.subscription.type === 'TRIAL' ? 'Deneme' : 'Yillik'}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl text-snow font-semibold">{daysLeft}</p>
            <p className="font-body text-xs text-silver">gun kaldi</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Toplam Tarama', value: stats?.totalScans ?? '—' },
          { label: 'Son 30 Gun', value: stats?.recentScans ?? '—' },
          { label: 'Kategori', value: stats?.categoryCount ?? '—' },
          { label: 'Urun', value: stats?.productCount ?? '—' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-surface border border-border rounded-xl p-6"
          >
            <p className="font-body text-xs text-silver uppercase tracking-widest">{s.label}</p>
            <p className="font-display text-3xl text-snow font-semibold mt-2">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
