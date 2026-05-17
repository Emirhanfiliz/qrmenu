import { useEffect, useState } from 'react';
import { api } from '../api';

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  isAvailable: boolean;
  category: { id: string; name: string };
};

const emptyForm = { categoryId: '', name: '', description: '', price: '', imageUrl: '', isAvailable: true };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCat, setFilterCat] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/products').then(setProducts).catch(() => {});
    api.get('/categories').then(setCategories).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      categoryId: p.category.id,
      name: p.name,
      description: p.description ?? '',
      price: p.price,
      imageUrl: p.imageUrl ?? '',
      isAvailable: p.isAvailable,
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = {
        categoryId: form.categoryId,
        name: form.name,
        price: parseFloat(form.price),
        ...(form.description ? { description: form.description } : {}),
        ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
        isAvailable: form.isAvailable,
      };
      if (editing) {
        await api.patch(`/products/${editing.id}`, body);
      } else {
        await api.post('/products', body);
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Urunu silmek istediginize emin misiniz?')) return;
    await api.delete(`/products/${id}`).catch(() => {});
    load();
  };

  const toggleAvailable = async (p: Product) => {
    await api.patch(`/products/${p.id}`, { isAvailable: !p.isAvailable }).catch(() => {});
    load();
  };

  const filtered = filterCat ? products.filter((p) => p.category.id === filterCat) : products;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-snow font-semibold">Urunler</h1>
          <p className="font-body text-silver text-sm mt-1">{filtered.length} urun</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-gold hover:bg-gold-dim text-void font-display font-semibold text-sm rounded-lg transition-colors"
        >
          Yeni Urun
        </button>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setFilterCat('')}
            className={`px-3 py-1.5 rounded-full text-xs font-body transition-all ${
              !filterCat ? 'bg-gold/15 text-gold' : 'bg-surface border border-border text-silver hover:text-snow'
            }`}
          >
            Tumü
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCat(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-body transition-all ${
                filterCat === c.id ? 'bg-gold/15 text-gold' : 'bg-surface border border-border text-silver hover:text-snow'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-7 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-snow text-lg font-semibold mb-6">
              {editing ? 'Urun Duzenle' : 'Yeni Urun'}
            </h2>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs text-silver uppercase tracking-widest">Kategori</label>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs text-silver uppercase tracking-widest">Urun Adi</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs text-silver uppercase tracking-widest">Aciklama (opsiyonel)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs text-silver uppercase tracking-widest">Fiyat (TL)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs text-silver uppercase tracking-widest">Fotograf URL (opsiyonel)</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors"
                  placeholder="https://..."
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                  className="w-4 h-4 accent-gold"
                />
                <span className="font-body text-silver text-sm">Satista mevcut</span>
              </label>

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

      {/* List */}
      {filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-16 text-center">
          <p className="font-body text-silver">Henuz urun yok.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-surface border border-border rounded-xl px-5 py-4 flex items-center gap-4">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-elevated flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-body text-snow font-medium truncate">{p.name}</p>
                  {!p.isAvailable && (
                    <span className="px-2 py-0.5 bg-red-900/30 text-red-400 text-xs rounded-full font-body flex-shrink-0">
                      Pasif
                    </span>
                  )}
                </div>
                <p className="font-body text-silver text-xs mt-0.5">{p.category.name}</p>
              </div>
              <p className="font-display text-gold font-medium text-sm flex-shrink-0">
                {Number(p.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => toggleAvailable(p)} className="px-3 py-1.5 text-xs font-body text-silver hover:text-snow border border-border hover:border-silver rounded-lg transition-colors">
                  {p.isAvailable ? 'Pasifle' : 'Aktifle'}
                </button>
                <button onClick={() => openEdit(p)} className="px-3 py-1.5 text-xs font-body text-silver hover:text-snow border border-border hover:border-silver rounded-lg transition-colors">
                  Duzenle
                </button>
                <button onClick={() => remove(p.id)} className="px-3 py-1.5 text-xs font-body text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-400/30 rounded-lg transition-colors">
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
