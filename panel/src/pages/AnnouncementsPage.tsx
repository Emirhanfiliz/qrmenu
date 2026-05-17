import { useEffect, useState } from 'react';
import { api } from '../api';
import ImageUpload from '../components/ImageUpload';

type Announcement = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', body: '', imageUrl: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get('/announcements').then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', body: '', imageUrl: '' });
    setShowForm(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, body: a.body, imageUrl: a.imageUrl ?? '' });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body: Record<string, unknown> = { title: form.title, body: form.body };
      if (form.imageUrl) body.imageUrl = form.imageUrl;
      if (editing) {
        await api.patch(`/announcements/${editing.id}`, body);
      } else {
        await api.post('/announcements', body);
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (a: Announcement) => {
    await api.patch(`/announcements/${a.id}`, { isActive: !a.isActive }).catch(() => {});
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Duyuruyu silmek istediginize emin misiniz?')) return;
    await api.delete(`/announcements/${id}`).catch(() => {});
    load();
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-snow font-semibold">Duyurular</h1>
          <p className="font-body text-silver text-sm mt-1">{items.length} duyuru</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-gold hover:bg-gold-dim text-void font-display font-semibold text-sm rounded-lg transition-colors">
          Yeni Duyuru
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-7 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-snow text-lg font-semibold mb-6">
              {editing ? 'Duyuru Duzenle' : 'Yeni Duyuru'}
            </h2>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs text-silver uppercase tracking-widest">Baslik</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs text-silver uppercase tracking-widest">Icerik</label>
                <textarea
                  required
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors resize-none"
                />
              </div>
              <ImageUpload
                label="Gorsel (opsiyonel)"
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
              />
              {error && <p className="font-body text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-border text-silver font-body text-sm rounded-lg hover:bg-elevated transition-colors">
                  Iptal
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-gold hover:bg-gold-dim text-void font-display font-semibold text-sm rounded-lg transition-colors disabled:opacity-50">
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-16 text-center">
          <p className="font-body text-silver">Henuz duyuru yok.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <div key={a.id} className={`bg-surface border rounded-xl overflow-hidden ${a.isActive ? 'border-border' : 'border-border opacity-60'}`}>
              {a.imageUrl && (
                <img src={a.imageUrl} alt={a.title} className="w-full h-36 object-cover" />
              )}
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-body text-snow font-medium">{a.title}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-body ${a.isActive ? 'bg-emerald-900/30 text-emerald-400' : 'bg-zinc-800 text-silver'}`}>
                        {a.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <p className="font-body text-silver text-sm mt-1 leading-relaxed">{a.body}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => toggle(a)} className="px-3 py-1.5 text-xs font-body text-silver hover:text-snow border border-border hover:border-silver rounded-lg transition-colors">
                      {a.isActive ? 'Pasifle' : 'Aktifle'}
                    </button>
                    <button onClick={() => openEdit(a)} className="px-3 py-1.5 text-xs font-body text-silver hover:text-snow border border-border hover:border-silver rounded-lg transition-colors">
                      Duzenle
                    </button>
                    <button onClick={() => remove(a.id)} className="px-3 py-1.5 text-xs font-body text-red-400 border border-red-900/30 hover:border-red-400/30 rounded-lg transition-colors">
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
