import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import ImageUpload from '../components/ImageUpload';

type Category = {
  id: string;
  name: string;
  imageUrl: string | null;
  order: number;
  _count: { products: number };
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', imageUrl: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOver = useRef<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = () => api.get('/categories').then(setCategories).catch(() => {});

  useEffect(() => {
    api.get('/categories')
      .then(setCategories)
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, []);

  const openNew = () => { setEditing(null); setForm({ name: '', imageUrl: '' }); setShowForm(true); };
  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, imageUrl: cat.imageUrl ?? '' });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = { name: form.name, ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}) };
      if (editing) await api.patch(`/categories/${editing.id}`, body);
      else await api.post('/categories', body);
      setShowForm(false);
      load();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    await api.delete(`/categories/${id}`).catch(() => {});
    load();
  };

  const onDragStart = (id: string) => setDragging(id);
  const onDragEnter = (id: string) => { dragOver.current = id; };
  const onDragEnd = async () => {
    if (!dragging || !dragOver.current || dragging === dragOver.current) { setDragging(null); return; }
    const from = categories.findIndex((c) => c.id === dragging);
    const to = categories.findIndex((c) => c.id === dragOver.current);
    const next = [...categories];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setCategories(next);
    setDragging(null);
    dragOver.current = null;
    await api.post('/categories/reorder', { ids: next.map((c) => c.id) }).catch(() => {});
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-snow font-semibold">Kategoriler</h1>
          <p className="font-body text-silver text-sm mt-1">
            {categories.length} kategori · sıralamak için sürükle
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-dim text-void font-display font-semibold text-sm rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Yeni Kategori
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
              className="bg-surface border border-border rounded-2xl p-7 w-full max-w-md"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <h2 className="font-display text-snow text-lg font-semibold mb-6">
                {editing ? 'Kategori Düzenle' : 'Yeni Kategori'}
              </h2>
              <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs text-silver uppercase tracking-widest">Kategori Adı</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors focus:outline-none"
                    placeholder="Aralar, Ana Yemekler..."
                  />
                </div>
                <ImageUpload
                  label="Fotoğraf (opsiyonel)"
                  value={form.imageUrl}
                  onChange={(url) => setForm({ ...form, imageUrl: url })}
                />
                {form.imageUrl && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-xl overflow-hidden"
                  >
                    <img src={form.imageUrl} alt="Önizleme" className="w-full h-40 object-cover rounded-xl" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-elevated" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-elevated rounded-lg w-3/4" />
                <div className="h-3 bg-elevated rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-dashed border-border rounded-2xl py-24 text-center"
        >
          <svg className="w-12 h-12 text-border mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="font-body text-silver">Henüz kategori yok.</p>
          <button onClick={openNew} className="mt-3 font-body text-gold text-sm hover:underline">İlk kategoriyi oluştur →</button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.id}
              draggable
              onDragStart={() => onDragStart(cat.id)}
              onDragEnter={() => onDragEnter(cat.id)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: dragging === cat.id ? 0.4 : 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className={`bg-surface border rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing group transition-shadow hover:shadow-xl hover:shadow-black/30 ${
                dragging === cat.id ? 'border-gold/40' : 'border-border'
              }`}
            >
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden bg-elevated relative">
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <svg className="w-10 h-10 text-border" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="font-body text-xs text-silver/40">Görsel yok</span>
                  </div>
                )}
                {/* Drag indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 rounded-lg p-1.5">
                    <svg width="10" height="14" viewBox="0 0 10 14" fill="white" opacity={0.7}>
                      <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/>
                      <circle cx="2" cy="7" r="1.5"/><circle cx="8" cy="7" r="1.5"/>
                      <circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="font-display text-snow font-semibold truncate">{cat.name}</p>
                <p className="font-body text-silver text-xs mt-0.5">{cat._count.products} ürün</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(cat); }}
                    className="flex-1 py-1.5 text-xs font-body text-silver hover:text-snow border border-border hover:border-silver/50 rounded-lg transition-colors"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmId(cat.id); }}
                    className="py-1.5 px-3 text-xs font-body text-red-400/70 hover:text-red-400 border border-red-900/20 hover:border-red-400/30 rounded-lg transition-colors"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmModal
          message="Bu kategori ve içindeki tüm ürünler silinecek. Emin misiniz?"
          confirmLabel="Evet, sil"
          onConfirm={() => { remove(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
