import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

type Log = {
  id: string;
  action: 'APPROVE_TRIAL' | 'APPROVE_ANNUAL' | 'RENEW_TRIAL' | 'RENEW_ANNUAL' | 'SUSPEND';
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  createdAt: string;
  admin: { email: string };
};

type Response = { logs: Log[]; total: number; page: number; pageSize: number };

const ACTION_META: Record<Log['action'], { label: string; color: string }> = {
  APPROVE_TRIAL:  { label: 'trial onaylandı',   color: 'text-emerge border-emerge/20 bg-emerge/5' },
  APPROVE_ANNUAL: { label: 'annual onaylandı',   color: 'text-emerge border-emerge/20 bg-emerge/5' },
  RENEW_TRIAL:    { label: '+30 gün yenilendi',  color: 'text-dim border-border bg-surface' },
  RENEW_ANNUAL:   { label: '+365 gün yenilendi', color: 'text-dim border-border bg-surface' },
  SUSPEND:        { label: 'askıya alındı',       color: 'text-danger border-danger/20 bg-danger/5' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function LogsPage() {
  const [data, setData] = useState<Response | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/logs?page=${page}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-bright text-lg">sistem logları</h1>
        {data && (
          <p className="font-mono text-dim text-xs">{data.total} kayıt</p>
        )}
      </div>

      {loading ? (
        <p className="font-mono text-dim text-sm py-12 text-center">// yükleniyor...</p>
      ) : !data?.logs.length ? (
        <p className="font-mono text-dim text-sm py-12 text-center">// henüz log yok</p>
      ) : (
        <>
          {/* Header row */}
          <div className="grid grid-cols-12 gap-3 px-4 py-2 font-mono text-xs text-dim uppercase tracking-widest">
            <div className="col-span-1">tarih</div>
            <div className="col-span-3">restoran</div>
            <div className="col-span-3">işlem</div>
            <div className="col-span-3">admin</div>
            <div className="col-span-2" />
          </div>

          <div className="flex flex-col gap-1.5">
            {data.logs.map((log) => {
              const meta = ACTION_META[log.action];
              return (
                <div
                  key={log.id}
                  className="bg-surface border border-border rounded-xl grid grid-cols-12 gap-3 px-4 py-3 items-center"
                >
                  <div className="col-span-1 min-w-0">
                    <p className="font-mono text-dim text-[11px] leading-tight">{formatDate(log.createdAt)}</p>
                  </div>

                  <div className="col-span-3 min-w-0">
                    <p className="font-mono text-bright text-sm truncate">{log.restaurantName}</p>
                    <p className="font-mono text-dim text-xs truncate">/{log.restaurantSlug}</p>
                  </div>

                  <div className="col-span-3">
                    <span className={`font-mono text-xs px-2 py-0.5 rounded border ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>

                  <div className="col-span-3 min-w-0">
                    <p className="font-mono text-dim text-xs truncate">{log.admin.email}</p>
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <Link
                      to={`/restaurants/${log.restaurantId}`}
                      className="font-mono text-xs text-dim hover:text-bright transition-colors"
                    >
                      detay →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="font-mono text-xs text-dim hover:text-bright disabled:opacity-30 transition-colors px-2 py-1"
              >
                ← önceki
              </button>
              <span className="font-mono text-xs text-dim">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="font-mono text-xs text-dim hover:text-bright disabled:opacity-30 transition-colors px-2 py-1"
              >
                sonraki →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
