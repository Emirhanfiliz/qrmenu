import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
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
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', imageUrl: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOver = useRef<string | null>(null);

  const load = () => api.get('/categories').then(setCategories).catch(() => {});

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: '', imageUrl: '' }); setShowForm(true); };
  const openEdit = (cat: Category) => { setEditing(cat); setForm({ name: cat.name, imageUrl: cat.imageUrl ?? '' }); setShowForm(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = { name: form.name, ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}) };
      if (editing) { await api.patch(`/categories/${editing.id}`, body); }
      else { await api.post('/categories', body); }
      setShowForm(false);
      load();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Kategoriyi silmek istediginize emin misiniz?')) return;
    await api.delete(`/categories/${id}`).catch(() => {});
    load();
  };

  /* ── Drag & Drop ── */
  const onDragStart = (id: string) => setDragging(id);
  const onDragEnter = (id: string) => { dragOver.current = id; };
  const onDragEnd = async () => {
    if (!dragging || !dragOver.current || dragging === dragOver.current) { setDragging(null); return; }
    const from = categories.findIndex(c => c.id === dragging);
    const to = categories.findIndex(c => c.id === dragOver.current);
    const next = [...categories];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setCategories(next);
    setDragging(null);
    dragOver.current = null;
    await api.post('/categories/reorder', { ids: next.map(c => c.id) }).catch(() => {});
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-snow font-semibold">Kategoriler</h1>
          <p className="font-body text-silver text-sm mt-1">{categories.length} kategori — siralamayi degistirmek icin surukle</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-gold hover:bg-gold-dim text-void font-display font-semibold text-sm rounded-lg transition-colors">
          Yeni Kategori
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-7 w-full max-w-md">
            <h2 className="font-display text-snow text-lg font-semibold mb-6">{editing ? 'Kategori Duzenle' : 'Yeni Kategori'}</h2>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs text-silver uppercase tracking-widest">Kategori Adi</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors"
                  placeholder="Aralar, Ana Yemekler..."
                />
              </div>
              <ImageUpload
                label="Fotograf (opsiyonel)"
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
              />
              {error && <p className="font-body text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-border text-silver font-body text-sm rounded-lg hover:bg-elevated transition-colors">Iptal</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-gold hover:bg-gold-dim text-void font-display font-semibold text-sm rounded-lg transition-colors disabled:opacity-50">
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {categories.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-16 text-center">
          <p className="font-body text-silver">Henuz kategori yok.</p>
          <button onClick={openNew} className="mt-3 font-body text-gold text-sm hover:underline">Ilk kategoriyi olustur</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              draggable
              onDragStart={() => onDragStart(cat.id)}
              onDragEnter={() => onDragEnter(cat.id)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`bg-surface border rounded-xl px-5 py-4 flex items-center gap-4 cursor-grab active:cursor-grabbing transition-all ${
                dragging === cat.id ? 'opacity-40 border-gold/40' : 'border-border'
              }`}
            >
              {/* Drag handle */}
              <div className="text-silver/30 flex-shrink-0 select-none">
                <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
                  <circle cx="3" cy="4" r="2"/><circle cx="11" cy="4" r="2"/>
                  <circle cx="3" cy="10" r="2"/><circle cx="11" cy="10" r="2"/>
                  <circle cx="3" cy="16" r="2"/><circle cx="11" cy="16" r="2"/>
                </svg>
              </div>

              {cat.imageUrl ? (
                <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-elevated flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-body text-snow font-medium truncate">{cat.name}</p>
                <p className="font-body text-silver text-xs mt-0.5">{cat._count.products} urun</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(cat)} className="px-3 py-1.5 text-xs font-body text-silver hover:text-snow border border-border hover:border-silver rounded-lg transition-colors">Duzenle</button>
                <button onClick={() => remove(cat.id)} className="px-3 py-1.5 text-xs font-body text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-400/30 rounded-lg transition-colors">Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
