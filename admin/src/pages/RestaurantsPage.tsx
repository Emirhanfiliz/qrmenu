import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ConfirmModal from '../components/ConfirmModal';

type Restaurant = {
  id: string;
  name: string;
  email: string;
  slug: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  subscription: { type: string; endsAt: string; startsAt: string } | null;
};

const STATUS_FILTER = ['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED'] as const;

function subStatus(sub: Restaurant['subscription']): 'none' | 'expired' | 'soon' | 'ok' {
  if (!sub) return 'none';
  const ends = new Date(sub.endsAt).getTime();
  const now = Date.now();
  if (ends < now) return 'expired';
  const days = Math.ceil((ends - now) / 86400000);
  if (days <= 7) return 'soon';
  return 'ok';
}

function daysLeft(sub: Restaurant['subscription']): number {
  if (!sub) return 0;
  return Math.max(0, Math.ceil((new Date(sub.endsAt).getTime() - Date.now()) / 86400000));
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filter, setFilter] = useState<typeof STATUS_FILTER[number]>('ALL');
  const [acting, setActing] = useState<string | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = (status?: string) => {
    const path = status && status !== 'ALL' ? `/admin/restaurants?status=${status}` : '/admin/restaurants';
    api.get(path).then(setRestaurants).catch(() => {});
  };

  useEffect(() => { load(filter); }, [filter]);

  const approve = async (id: string, type: 'TRIAL' | 'ANNUAL') => {
    setActing(id);
    try {
      await api.patch(`/admin/restaurants/${id}/approve`, { type });
      load(filter);
    } catch (err: any) { setErrorMsg(err.message); }
    finally { setActing(null); }
  };

  const renew = async (id: string, type: 'TRIAL' | 'ANNUAL') => {
    setActing(id);
    try {
      await api.patch(`/admin/restaurants/${id}/renew`, { type });
      load(filter);
    } catch (err: any) { setErrorMsg(err.message); }
    finally { setActing(null); }
  };

  const suspend = async (id: string) => {
    setActing(id);
    try {
      await api.patch(`/admin/restaurants/${id}/suspend`, {});
      load(filter);
    } catch (err: any) { setErrorMsg(err.message); }
    finally { setActing(null); }
  };

  const statusColor = (s: string) => {
    if (s === 'ACTIVE') return 'text-emerge';
    if (s === 'PENDING') return 'text-warn';
    return 'text-danger';
  };

  const pendingCount = restaurants.filter((r) => r.status === 'PENDING').length;
  const expiredCount = restaurants.filter(
    (r) => r.status === 'ACTIVE' && subStatus(r.subscription) === 'expired',
  ).length;

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-bright text-lg">restaurants</h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-warn/10 text-warn text-xs font-mono rounded">{pendingCount} bekliyor</span>
            )}
            {expiredCount > 0 && (
              <span className="px-2 py-0.5 bg-danger/10 text-danger text-xs font-mono rounded">{expiredCount} sona erdi</span>
            )}
          </div>
          <p className="font-mono text-dim text-xs">{restaurants.length} kayıt</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {STATUS_FILTER.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 font-mono text-xs transition-colors border-b-2 -mb-px ${
                filter === s ? 'text-bright border-emerge' : 'text-dim border-transparent hover:text-bright'
              }`}
            >
              {s.toLowerCase()}
            </button>
          ))}
        </div>

        {restaurants.length === 0 ? (
          <p className="font-mono text-dim text-sm py-12 text-center">// no records found</p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-12 gap-3 px-4 py-2 font-mono text-xs text-dim uppercase tracking-widest">
              <div className="col-span-3">restoran</div>
              <div className="col-span-2">email</div>
              <div className="col-span-1">durum</div>
              <div className="col-span-3">abonelik</div>
              <div className="col-span-3 text-right">islemler</div>
            </div>

            {restaurants.map((r) => {
              const ss = subStatus(r.subscription);
              const dl = daysLeft(r.subscription);
              return (
                <div
                  key={r.id}
                  className={`bg-surface border rounded-xl grid grid-cols-12 gap-3 px-4 py-4 items-center ${
                    ss === 'expired' && r.status === 'ACTIVE'
                      ? 'border-danger/30'
                      : ss === 'soon' && r.status === 'ACTIVE'
                      ? 'border-warn/30'
                      : 'border-border'
                  }`}
                >
                  {/* Name */}
                  <Link to={`/restaurants/${r.id}`} className="col-span-3 min-w-0 group">
                    <p className="font-mono text-bright text-sm truncate group-hover:text-emerge transition-colors">{r.name}</p>
                    <p className="font-mono text-dim text-xs mt-0.5 truncate">/{r.slug}</p>
                  </Link>

                  {/* Email */}
                  <div className="col-span-2 min-w-0">
                    <p className="font-mono text-dim text-xs truncate">{r.email}</p>
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <span className={`font-mono text-xs ${statusColor(r.status)}`}>
                      {r.status.toLowerCase()}
                    </span>
                  </div>

                  {/* Subscription */}
                  <div className="col-span-3">
                    {r.subscription ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-bright">
                            {r.subscription.type === 'TRIAL' ? 'trial' : 'annual'}
                          </span>
                          {ss === 'expired' ? (
                            <span className="font-mono text-xs text-danger">sona erdi</span>
                          ) : ss === 'soon' ? (
                            <span className="font-mono text-xs text-warn">{dl}g kaldi</span>
                          ) : (
                            <span className="font-mono text-xs text-dim">{dl}g kaldi</span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-dim mt-0.5">
                          {new Date(r.subscription.endsAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-dim">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 flex gap-1.5 justify-end flex-wrap">
                    {/* PENDING or SUSPENDED → approve */}
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

                    {/* ACTIVE → renew (always visible) + suspend */}
                    {r.status === 'ACTIVE' && (
                      <>
                        <button
                          onClick={() => renew(r.id, 'TRIAL')}
                          disabled={acting === r.id}
                          className={`px-2 py-1 text-xs font-mono border rounded transition-colors disabled:opacity-40 ${
                            ss === 'expired'
                              ? 'text-danger border-danger/30 hover:bg-danger/10'
                              : ss === 'soon'
                              ? 'text-warn border-warn/30 hover:bg-warn/10'
                              : 'text-dim border-border hover:text-bright hover:border-bright/30'
                          }`}
                        >
                          +30g
                        </button>
                        <button
                          onClick={() => renew(r.id, 'ANNUAL')}
                          disabled={acting === r.id}
                          className={`px-2 py-1 text-xs font-mono border rounded transition-colors disabled:opacity-40 ${
                            ss === 'expired'
                              ? 'text-danger border-danger/30 hover:bg-danger/10'
                              : ss === 'soon'
                              ? 'text-warn border-warn/30 hover:bg-warn/10'
                              : 'text-dim border-border hover:text-bright hover:border-bright/30'
                          }`}
                        >
                          +365g
                        </button>
                        <button
                          onClick={() => setConfirmSuspend(r.id)}
                          disabled={acting === r.id}
                          className="px-2 py-1 text-xs font-mono text-danger border border-danger/20 hover:bg-danger/10 rounded transition-colors disabled:opacity-40"
                        >
                          suspend
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {confirmSuspend && (
        <ConfirmModal
          message="Restoranı askıya almak istediğinize emin misiniz? Müşteriler menüye erişemez."
          confirmLabel="evet, askıya al"
          onConfirm={() => { suspend(confirmSuspend); setConfirmSuspend(null); }}
          onCancel={() => setConfirmSuspend(null)}
        />
      )}

      {errorMsg && (
        <ConfirmModal
          message={errorMsg}
          confirmLabel="tamam"
          danger={false}
          onConfirm={() => setErrorMsg(null)}
          onCancel={() => setErrorMsg(null)}
        />
      )}
    </div>
  );
}
