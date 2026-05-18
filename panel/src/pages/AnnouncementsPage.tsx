import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import ConfirmModal from '../components/ConfirmModal';
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
  const [listLoading, setListLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', body: '', imageUrl: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = () => api.get('/announcements').then(setItems).catch(() => {});

  useEffect(() => {
    api.get('/announcements')
      .then(setItems)
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, []);

  const openNew = () => { setEditing(null); setForm({ title: '', body: '', imageUrl: '' }); setShowForm(true); };
  const openEdit = (a: Announcement) => { setEditing(a); setForm({ title: a.title, body: a.body, imageUrl: a.imageUrl ?? '' }); setShowForm(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body: Record<string, unknown> = { title: form.title, body: form.body };
      if (form.imageUrl) body.imageUrl = form.imageUrl;
      if (editing) await api.patch(`/announcements/${editing.id}`, body);
      else await api.post('/announcements', body);
      setShowForm(false);
      load();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const toggle = async (a: Announcement) => {
    await api.patch(`/announcements/${a.id}`, { isActive: !a.isActive }).catch(() => {});
    load();
  };

  const remove = async (id: string) => {
    await api.delete(`/announcements/${id}`).catch(() => {});
    load();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-snow font-semibold">Duyurular</h1>
          <p className="font-body text-silver text-sm mt-1">{items.length} duyuru</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-dim text-void font-display font-semibold text-sm rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Yeni Duyuru
        </button>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-surface border border-border rounded-2xl p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <h2 className="font-display text-snow text-lg font-semibold mb-6">
                {editing ? 'Duyuru Düzenle' : 'Yeni Duyuru'}
              </h2>
              <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs text-silver uppercase tracking-widest">Başlık</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs text-silver uppercase tracking-widest">İçerik</label>
                  <textarea
                    required
                    rows={4}
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors resize-none focus:outline-none"
                  />
                </div>
                <ImageUpload
                  label="Görsel (opsiyonel)"
                  value={form.imageUrl}
                  onChange={(url) => setForm({ ...form, imageUrl: url })}
                />
                {form.imageUrl && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <img src={form.imageUrl} alt="Önizleme" className="w-full h-48 object-cover rounded-xl" />
                  </motion.div>
                )}
                {error && <p className="font-body text-red-400 text-sm">{error}</p>}
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-border text-silver font-body text-sm rounded-lg hover:bg-elevated transition-colors">İptal</button>
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-gold hover:bg-gold-dim text-void font-display font-semibold text-sm rounded-lg transition-colors disabled:opacity-50">
                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {listLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl overflow-hidden animate-pulse">
              <div className="h-52 bg-elevated" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-elevated rounded-lg w-2/3" />
                <div className="h-3 bg-elevated rounded-lg w-full" />
                <div className="h-3 bg-elevated rounded-lg w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-dashed border-border rounded-2xl py-24 text-center"
        >
          <svg className="w-12 h-12 text-border mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <p className="font-body text-silver">Henüz duyuru yok.</p>
          <button onClick={openNew} className="mt-3 font-body text-gold text-sm hover:underline">İlk duyuruyu oluştur →</button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {items.map((a, index) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: a.isActive ? 1 : 0.55, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ delay: index * 0.05, duration: 0.25 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className={`bg-surface border rounded-2xl overflow-hidden group hover:shadow-xl hover:shadow-black/30 transition-shadow ${
                  a.isActive ? 'border-border' : 'border-border/50'
                }`}
              >
                {/* Image */}
                {a.imageUrl ? (
                  <div className="h-52 overflow-hidden">
                    <img
                      src={a.imageUrl}
                      alt={a.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="h-36 bg-elevated flex items-center justify-center">
                    <svg className="w-10 h-10 text-border" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.isActive ? 'bg-emerald-400' : 'bg-silver/30'}`} />
                    <p className="font-display text-snow font-semibold text-sm flex-1 truncate">{a.title}</p>
                    <span className={`font-body text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      a.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-border/50 text-silver/60'
                    }`}>
                      {a.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <p className="font-body text-silver text-sm leading-relaxed line-clamp-2">{a.body}</p>
                  <p className="font-body text-silver/40 text-xs mt-2">
                    {new Date(a.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => toggle(a)}
                      className={`flex-1 py-1.5 text-xs font-body rounded-lg border transition-colors ${
                        a.isActive
                          ? 'border-border text-silver hover:text-snow hover:border-silver/50'
                          : 'border-emerald-700/30 text-emerald-400 hover:border-emerald-400/50'
                      }`}
                    >
                      {a.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                    </button>
                    <button
                      onClick={() => openEdit(a)}
                      className="px-3 py-1.5 text-xs font-body text-silver hover:text-snow border border-border hover:border-silver/50 rounded-lg transition-colors"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => setConfirmId(a.id)}
                      className="px-3 py-1.5 text-xs font-body text-red-400/60 hover:text-red-400 border border-red-900/20 hover:border-red-400/30 rounded-lg transition-colors"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {confirmId && (
        <ConfirmModal
          message="Bu duyuru silinecek. Emin misiniz?"
          confirmLabel="Evet, sil"
          onConfirm={() => { remove(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
