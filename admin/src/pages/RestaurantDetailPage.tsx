import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import ConfirmModal from '../components/ConfirmModal';

type DailyCount = { date: string; count: number };
type Subscription = { type: string; endsAt: string; startsAt: string };
type Category = { id: string; name: string; imageUrl: string | null; order: number; products: { id: string }[] };

type Detail = {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  address: string | null;
  phone: string | null;
  tagline: string | null;
  workingHours: string | null;
  wifiInfo: string | null;
  theme: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  googleMapsUrl: string | null;
  subscription: Subscription | null;
  categories: Category[];
  stats: {
    categoryCount: number;
    productCount: number;
    totalScans: number;
    dailyScans: DailyCount[];
  };
};

function MiniBar({ data }: { data: DailyCount[] }) {
  if (!data.length) return <p className="font-mono text-dim text-xs">// scan yok</p>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-12">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center group relative">
          <div
            className="w-full bg-emerge/40 group-hover:bg-emerge transition-colors rounded-sm"
            style={{ height: `${Math.max(2, (d.count / max) * 48)}px` }}
          />
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-bright bg-surface border border-border px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
            {d.date.slice(5)} — {d.count}
          </span>
        </div>
      ))}
    </div>
  );
}

function daysLeft(sub: Subscription | null) {
  if (!sub) return null;
  return Math.ceil((new Date(sub.endsAt).getTime() - Date.now()) / 86400000);
}

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = () => {
    api.get(`/admin/restaurants/${id}`)
      .then(setDetail)
      .catch(() => navigate('/restaurants'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const approve = async (type: 'TRIAL' | 'ANNUAL') => {
    if (!detail) return;
    setActing(true);
    try { await api.patch(`/admin/restaurants/${detail.id}/approve`, { type }); load(); }
    catch (e: any) { setErrorMsg(e.message); }
    finally { setActing(false); }
  };

  const renew = async (type: 'TRIAL' | 'ANNUAL') => {
    if (!detail) return;
    setActing(true);
    try { await api.patch(`/admin/restaurants/${detail.id}/renew`, { type }); load(); }
    catch (e: any) { setErrorMsg(e.message); }
    finally { setActing(false); }
  };

  const suspend = async () => {
    if (!detail) return;
    setActing(true);
    try { await api.patch(`/admin/restaurants/${detail.id}/suspend`, {}); load(); }
    catch (e: any) { setErrorMsg(e.message); }
    finally { setActing(false); }
  };

  if (loading) return <p className="font-mono text-dim text-sm p-8">// yükleniyor...</p>;
  if (!detail) return null;

  const dl = daysLeft(detail.subscription);
  const subExpired = dl !== null && dl < 0;
  const subSoon = dl !== null && dl >= 0 && dl <= 7;

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/restaurants" className="font-mono text-dim text-xs hover:text-bright transition-colors">← geri</Link>
        <span className="text-border">/</span>
        <h1 className="font-mono text-bright text-base">{detail.name}</h1>
        <span className={`font-mono text-xs px-2 py-0.5 rounded ${
          detail.status === 'ACTIVE' ? 'bg-emerge/10 text-emerge' :
          detail.status === 'PENDING' ? 'bg-warn/10 text-warn' : 'bg-danger/10 text-danger'
        }`}>{detail.status.toLowerCase()}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Stats */}
        {[
          { label: 'kategori', value: detail.stats.categoryCount },
          { label: 'ürün', value: detail.stats.productCount },
          { label: 'toplam scan', value: detail.stats.totalScans },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl px-4 py-4">
            <p className="font-mono text-dim text-xs mb-1">{s.label}</p>
            <p className="font-mono text-bright text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Scan chart */}
      <div className="bg-surface border border-border rounded-xl px-5 py-4 space-y-3">
        <p className="font-mono text-dim text-xs uppercase tracking-widest">son 30 gün scan</p>
        <MiniBar data={detail.stats.dailyScans} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Info */}
        <div className="bg-surface border border-border rounded-xl px-5 py-4 space-y-3">
          <p className="font-mono text-dim text-xs uppercase tracking-widest">bilgiler</p>
          {[
            { label: 'email', value: detail.email },
            { label: 'slug', value: `/${detail.slug}` },
            { label: 'tema', value: detail.theme || '—' },
            { label: 'adres', value: detail.address || '—' },
            { label: 'tel', value: detail.phone || '—' },
            { label: 'wifi', value: detail.wifiInfo || '—' },
            { label: 'kayıt', value: new Date(detail.createdAt).toLocaleDateString('tr-TR') },
          ].map((row) => (
            <div key={row.label} className="flex gap-3">
              <span className="font-mono text-dim text-xs w-16 shrink-0">{row.label}</span>
              <span className="font-mono text-bright text-xs truncate">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Subscription + actions */}
        <div className="bg-surface border border-border rounded-xl px-5 py-4 space-y-4">
          <p className="font-mono text-dim text-xs uppercase tracking-widest">abonelik</p>
          {detail.subscription ? (
            <div className="space-y-1">
              <p className="font-mono text-bright text-sm">
                {detail.subscription.type === 'TRIAL' ? 'trial' : 'annual'}
              </p>
              <p className={`font-mono text-xs ${subExpired ? 'text-danger' : subSoon ? 'text-warn' : 'text-dim'}`}>
                {subExpired ? 'sona erdi' : `${dl} gün kaldı`}
                {' · '}{new Date(detail.subscription.endsAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          ) : (
            <p className="font-mono text-dim text-xs">abonelik yok</p>
          )}

          <div className="space-y-2 pt-2 border-t border-border">
            <p className="font-mono text-dim text-xs uppercase tracking-widest">işlemler</p>
            <div className="flex flex-wrap gap-2">
              {detail.status !== 'ACTIVE' && (
                <>
                  <button onClick={() => approve('TRIAL')} disabled={acting}
                    className="px-3 py-1.5 text-xs font-mono text-emerge border border-emerge/20 hover:bg-emerge/10 rounded transition-colors disabled:opacity-40">
                    trial onayla
                  </button>
                  <button onClick={() => approve('ANNUAL')} disabled={acting}
                    className="px-3 py-1.5 text-xs font-mono text-emerge border border-emerge/20 hover:bg-emerge/10 rounded transition-colors disabled:opacity-40">
                    annual onayla
                  </button>
                </>
              )}
              {detail.status === 'ACTIVE' && (
                <>
                  <button onClick={() => renew('TRIAL')} disabled={acting}
                    className={`px-3 py-1.5 text-xs font-mono border rounded transition-colors disabled:opacity-40 ${
                      subExpired ? 'text-danger border-danger/30 hover:bg-danger/10' :
                      subSoon ? 'text-warn border-warn/30 hover:bg-warn/10' :
                      'text-dim border-border hover:text-bright'}`}>
                    +30 gün
                  </button>
                  <button onClick={() => renew('ANNUAL')} disabled={acting}
                    className={`px-3 py-1.5 text-xs font-mono border rounded transition-colors disabled:opacity-40 ${
                      subExpired ? 'text-danger border-danger/30 hover:bg-danger/10' :
                      subSoon ? 'text-warn border-warn/30 hover:bg-warn/10' :
                      'text-dim border-border hover:text-bright'}`}>
                    +365 gün
                  </button>
                  <button onClick={() => setConfirmSuspend(true)} disabled={acting}
                    className="px-3 py-1.5 text-xs font-mono text-danger border border-danger/20 hover:bg-danger/10 rounded transition-colors disabled:opacity-40">
                    askıya al
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      {detail.categories.length > 0 && (
        <div>
          <p className="font-mono text-dim text-xs uppercase tracking-widest mb-3">kategoriler</p>
          <div className="flex flex-col gap-1.5">
            {detail.categories.map((cat) => (
              <div key={cat.id}
                className="bg-surface border border-border rounded-lg px-4 py-2.5 flex items-center justify-between">
                <span className="font-mono text-bright text-sm">{cat.name}</span>
                <span className="font-mono text-dim text-xs">{cat.products.length} ürün</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmSuspend && (
        <ConfirmModal
          message="Restoranı askıya almak istediğinize emin misiniz?"
          confirmLabel="evet, askıya al"
          onConfirm={() => { suspend(); setConfirmSuspend(false); }}
          onCancel={() => setConfirmSuspend(false)}
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
