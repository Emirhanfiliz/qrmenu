import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import ImageUpload from '../components/ImageUpload';

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  discountedPrice: string | null;
  preparationTime: number | null;
  calories: number | null;
  allergens: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  order: number;
  category: { id: string; name: string };
};

const ALLERGEN_LIST = [
  'Gluten', 'Süt', 'Yumurta', 'Yer fıstığı', 'Soya',
  'Balık', 'Kabuklu deniz ürünleri', 'Fındık/Ceviz', 'Susam', 'Hardal',
];

const emptyForm = {
  categoryId: '',
  name: '',
  description: '',
  price: '',
  discountedPrice: '',
  preparationTime: '',
  calories: '',
  allergens: [] as string[],
  imageUrl: '',
  isAvailable: true,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOver = useRef<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = () => {
    api.get('/products').then(setProducts).catch(() => {});
    api.get('/categories').then(setCategories).catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      api.get('/products').then(setProducts),
      api.get('/categories').then(setCategories),
    ])
      .catch(() => setListError('Veriler yüklenemedi.'))
      .finally(() => setListLoading(false));
  }, []);

  const parseAllergens = (raw: string | null): string[] => {
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  };

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
      discountedPrice: p.discountedPrice ?? '',
      preparationTime: p.preparationTime != null ? String(p.preparationTime) : '',
      calories: p.calories != null ? String(p.calories) : '',
      allergens: parseAllergens(p.allergens),
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
      const body: Record<string, unknown> = {
        categoryId: form.categoryId,
        name: form.name,
        price: parseFloat(form.price),
        isAvailable: form.isAvailable,
      };
      if (form.description) body.description = form.description;
      if (form.imageUrl) body.imageUrl = form.imageUrl;
      if (form.discountedPrice) body.discountedPrice = parseFloat(form.discountedPrice);
      if (form.preparationTime) body.preparationTime = parseInt(form.preparationTime);
      if (form.calories) body.calories = parseInt(form.calories);
      if (form.allergens.length > 0) body.allergens = JSON.stringify(form.allergens);

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
    try {
      await api.delete(`/products/${id}`);
      load();
    } catch { /* toast handled by api */ }
  };

  const toggleAvailable = async (p: Product) => {
    try {
      await api.patch(`/products/${p.id}`, { isAvailable: !p.isAvailable });
      load();
    } catch { /* toast handled by api */ }
  };

  const toggleAllergen = (a: string) => {
    setForm(prev => ({
      ...prev,
      allergens: prev.allergens.includes(a)
        ? prev.allergens.filter(x => x !== a)
        : [...prev.allergens, a],
    }));
  };

  /* Drag & Drop */
  const onDragStart = (id: string) => setDragging(id);
  const onDragEnter = (id: string) => { dragOver.current = id; };
  const onDragEnd = async () => {
    if (!dragging || !dragOver.current || dragging === dragOver.current) { setDragging(null); return; }
    const src = filtered;
    const from = src.findIndex(p => p.id === dragging);
    const to = src.findIndex(p => p.id === dragOver.current);
    const next = [...src];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const others = products.filter(p => !next.find(n => n.id === p.id));
    setProducts([...next, ...others]);
    setDragging(null);
    dragOver.current = null;
    await api.post('/products/reorder', { ids: next.map(p => p.id) }).catch(() => {});
  };

  const filtered = filterCat ? products.filter((p) => p.category.id === filterCat) : products;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-snow font-semibold">Urunler</h1>
          <p className="font-body text-silver text-sm mt-1">{filtered.length} urun — surukleyerek sirala</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-gold hover:bg-gold-dim text-void font-display font-semibold text-sm rounded-lg transition-colors">
          Yeni Urun
        </button>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <button onClick={() => setFilterCat('')} className={`px-3 py-1.5 rounded-full text-xs font-body transition-all ${!filterCat ? 'bg-gold/15 text-gold' : 'bg-surface border border-border text-silver hover:text-snow'}`}>
            Tumu
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setFilterCat(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-body transition-all ${filterCat === c.id ? 'bg-gold/15 text-gold' : 'bg-surface border border-border text-silver hover:text-snow'}`}>
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
                <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors">
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs text-silver uppercase tracking-widest">Urun Adi</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs text-silver uppercase tracking-widest">Aciklama (opsiyonel)</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs text-silver uppercase tracking-widest">Normal Fiyat (TL)</label>
                  <input type="number" required min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors" placeholder="0.00" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs text-silver uppercase tracking-widest">Indirimli Fiyat</label>
                  <input type="number" min="0" step="0.01" value={form.discountedPrice} onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })} className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs text-silver uppercase tracking-widest">Hazirlama (dk)</label>
                  <input type="number" min="0" step="1" value={form.preparationTime} onChange={(e) => setForm({ ...form, preparationTime: e.target.value })} className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors" placeholder="10" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs text-silver uppercase tracking-widest">Kalori (kcal)</label>
                  <input type="number" min="0" step="1" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors" placeholder="450" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-body text-xs text-silver uppercase tracking-widest">Alerjenler</label>
                <div className="flex flex-wrap gap-2">
                  {ALLERGEN_LIST.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAllergen(a)}
                      className={`px-3 py-1 rounded-full text-xs font-body transition-all border ${
                        form.allergens.includes(a)
                          ? 'bg-gold/20 border-gold/50 text-gold'
                          : 'bg-elevated border-border text-silver hover:text-snow'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <ImageUpload
                label="Fotograf (opsiyonel)"
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
              />

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="w-4 h-4 accent-gold" />
                <span className="font-body text-silver text-sm">Satista mevcut</span>
              </label>

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

      {listError && <p className="font-body text-red-400 text-sm mb-4">{listError}</p>}

      {listLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-gold/50 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-16 text-center">
          <p className="font-body text-silver">Henuz urun yok.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              draggable
              onDragStart={() => onDragStart(p.id)}
              onDragEnter={() => onDragEnter(p.id)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`bg-surface border rounded-xl px-5 py-4 flex items-center gap-4 cursor-grab active:cursor-grabbing transition-all ${dragging === p.id ? 'opacity-40 border-gold/40' : 'border-border'}`}
            >
              <div className="text-silver/30 flex-shrink-0 select-none">
                <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
                  <circle cx="3" cy="4" r="2"/><circle cx="11" cy="4" r="2"/>
                  <circle cx="3" cy="10" r="2"/><circle cx="11" cy="10" r="2"/>
                  <circle cx="3" cy="16" r="2"/><circle cx="11" cy="16" r="2"/>
                </svg>
              </div>
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-elevated flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-body text-snow font-medium truncate">{p.name}</p>
                  {!p.isAvailable && (
                    <span className="px-2 py-0.5 bg-red-900/30 text-red-400 text-xs rounded-full font-body flex-shrink-0">Pasif</span>
                  )}
                  {p.allergens && parseAllergens(p.allergens).length > 0 && (
                    <span className="px-2 py-0.5 bg-amber-900/30 text-amber-400 text-xs rounded-full font-body flex-shrink-0" title={parseAllergens(p.allergens).join(', ')}>
                      Alerjen
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="font-body text-silver text-xs">{p.category.name}</p>
                  {p.preparationTime && <p className="font-body text-silver/60 text-xs">{p.preparationTime} dk</p>}
                  {p.calories && <p className="font-body text-silver/60 text-xs">{p.calories} kcal</p>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {p.discountedPrice ? (
                  <div>
                    <p className="font-body text-silver/50 text-xs line-through">
                      {Number(p.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                    </p>
                    <p className="font-display text-gold font-medium text-sm">
                      {Number(p.discountedPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                    </p>
                  </div>
                ) : (
                  <p className="font-display text-gold font-medium text-sm">
                    {Number(p.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => toggleAvailable(p)} className="px-3 py-1.5 text-xs font-body text-silver hover:text-snow border border-border hover:border-silver rounded-lg transition-colors">
                  {p.isAvailable ? 'Pasifle' : 'Aktifle'}
                </button>
                <button onClick={() => openEdit(p)} className="px-3 py-1.5 text-xs font-body text-silver hover:text-snow border border-border hover:border-silver rounded-lg transition-colors">Duzenle</button>
                <button onClick={() => setConfirmId(p.id)} className="px-3 py-1.5 text-xs font-body text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-400/30 rounded-lg transition-colors">Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmModal
          message="Bu ürün silinecek. Emin misiniz?"
          confirmLabel="Evet, sil"
          onConfirm={() => { remove(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
