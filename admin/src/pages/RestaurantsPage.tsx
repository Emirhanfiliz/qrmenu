import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

type Restaurant = {
  id: string;
  name: string;
  email: string;
  slug: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  subscription: { type: string; endsAt: string } | null;
};

const STATUS_FILTER = ['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED'] as const;

export default function RestaurantsPage() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filter, setFilter] = useState<typeof STATUS_FILTER[number]>('ALL');
  const [acting, setActing] = useState<string | null>(null);

  const load = (status?: string) => {
    const path = status && status !== 'ALL' ? `/admin/restaurants?status=${status}` : '/admin/restaurants';
    api.get(path).then(setRestaurants).catch(() => {});
  };

  useEffect(() => { load(filter); }, [filter]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const approve = async (id: string, type: 'TRIAL' | 'ANNUAL') => {
    setActing(id);
    try {
      await api.patch(`/admin/restaurants/${id}/approve`, { type });
      load(filter);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const suspend = async (id: string) => {
    if (!confirm('Restorani askiya almak istediginize emin misiniz?')) return;
    setActing(id);
    try {
      await api.patch(`/admin/restaurants/${id}/suspend`, {});
      load(filter);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'ACTIVE') return 'text-emerge';
    if (s === 'PENDING') return 'text-warn';
    return 'text-danger';
  };

  const pendingCount = restaurants.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="font-mono text-emerge text-sm">qrmenu/admin</p>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-warn/10 text-warn text-xs font-mono rounded">
              {pendingCount} bekliyor
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <p className="font-mono text-dim text-xs">{admin?.email}</p>
          <button onClick={handleLogout} className="font-mono text-xs text-dim hover:text-bright transition-colors">
            logout
          </button>
        </div>
      </header>

      <div className="px-6 py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-mono text-bright text-lg">restaurants</h1>
          <p className="font-mono text-dim text-xs">{restaurants.length} kayit</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {STATUS_FILTER.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 font-mono text-xs transition-colors border-b-2 -mb-px ${
                filter === s
                  ? 'text-bright border-emerge'
                  : 'text-dim border-transparent hover:text-bright'
              }`}
            >
              {s.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Table */}
        {restaurants.length === 0 ? (
          <p className="font-mono text-dim text-sm py-12 text-center">// no records found</p>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2 font-mono text-xs text-dim uppercase tracking-widest">
              <div className="col-span-3">restoran</div>
              <div className="col-span-3">email</div>
              <div className="col-span-2">durum</div>
              <div className="col-span-2">abonelik</div>
              <div className="col-span-2 text-right">islemler</div>
            </div>

            {restaurants.map((r) => (
              <div
                key={r.id}
                className="bg-surface border border-border rounded-xl grid grid-cols-12 gap-3 px-4 py-4 items-center"
              >
                <div className="col-span-3 min-w-0">
                  <p className="font-mono text-bright text-sm truncate">{r.name}</p>
                  <p className="font-mono text-dim text-xs mt-0.5 truncate">/{r.slug}</p>
                </div>

                <div className="col-span-3 min-w-0">
                  <p className="font-mono text-dim text-xs truncate">{r.email}</p>
                </div>

                <div className="col-span-2">
                  <span className={`font-mono text-xs ${statusColor(r.status)}`}>
                    {r.status.toLowerCase()}
                  </span>
                </div>

                <div className="col-span-2">
                  {r.subscription ? (
                    <div>
                      <p className="font-mono text-xs text-bright">
                        {r.subscription.type === 'TRIAL' ? 'trial' : 'annual'}
                      </p>
                      <p className="font-mono text-xs text-dim mt-0.5">
                        {new Date(r.subscription.endsAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  ) : (
                    <span className="font-mono text-xs text-dim">—</span>
                  )}
                </div>

                <div className="col-span-2 flex gap-2 justify-end flex-wrap">
                  {r.status !== 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => approve(r.id, 'TRIAL')}
                        disabled={acting === r.id}
                        className="px-2 py-1 text-xs font-mono text-emerge border border-emerge/20 hover:bg-emerge/10 rounded transition-colors disabled:opacity-40"
                      >
                        trial
                      </button>
                      <button
                        onClick={() => approve(r.id, 'ANNUAL')}
                        disabled={acting === r.id}
                        className="px-2 py-1 text-xs font-mono text-emerge border border-emerge/20 hover:bg-emerge/10 rounded transition-colors disabled:opacity-40"
                      >
                        annual
                      </button>
                    </>
                  )}
                  {r.status === 'ACTIVE' && (
                    <button
                      onClick={() => suspend(r.id)}
                      disabled={acting === r.id}
                      className="px-2 py-1 text-xs font-mono text-danger border border-danger/20 hover:bg-danger/10 rounded transition-colors disabled:opacity-40"
                    >
                      suspend
                    </button>
                  )}
                  {r.status === 'SUSPENDED' && (
                    <>
                      <button
                        onClick={() => approve(r.id, 'TRIAL')}
                        disabled={acting === r.id}
                        className="px-2 py-1 text-xs font-mono text-warn border border-warn/20 hover:bg-warn/10 rounded transition-colors disabled:opacity-40"
                      >
                        reactivate
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
