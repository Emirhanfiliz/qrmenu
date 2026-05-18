import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import ImageUpload from '../components/ImageUpload';
import { Tooltip } from '../components/Tooltip';

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
  const [search, setSearch] = useState('');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
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
      api.get('/products').then((data: Product[]) => { setProducts(data); return data; }),
      api.get('/categories').then((data: Category[]) => { setCategories(data); return data; }),
    ])
      .then(([, cats]) => {
        setExpandedCats(new Set((cats as Category[]).map((c) => c.id)));
      })
      .catch(() => setListError('Veriler yüklenemedi.'))
      .finally(() => setListLoading(false));
  }, []);

  const parseAllergens = (raw: string | null): string[] => {
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  };

  const toggleCat = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
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
    setForm((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(a)
        ? prev.allergens.filter((x) => x !== a)
        : [...prev.allergens, a],
    }));
  };

  /* Drag & Drop — only within same category */
  const onDragStart = (id: string) => setDragging(id);
  const onDragEnter = (id: string) => { dragOver.current = id; };
  const onDragEnd = async () => {
    if (!dragging || !dragOver.current || dragging === dragOver.current) { setDragging(null); return; }
    const draggedProduct = products.find((p) => p.id === dragging);
    const targetProduct = products.find((p) => p.id === dragOver.current);
    if (!draggedProduct || !targetProduct || draggedProduct.category.id !== targetProduct.category.id) {
      setDragging(null);
      return;
    }
    const catProducts = products.filter((p) => p.category.id === draggedProduct.category.id);
    const from = catProducts.findIndex((p) => p.id === dragging);
    const to = catProducts.findIndex((p) => p.id === dragOver.current);
    const next = [...catProducts];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const others = products.filter((p) => p.category.id !== draggedProduct.category.id);
    setProducts([...others, ...next]);
    setDragging(null);
    dragOver.current = null;
    await api.post('/products/reorder', { ids: next.map((p) => p.id) }).catch(() => {});
  };

  const totalCount = products.length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-snow font-semibold">Ürünler</h1>
          <p className="font-body text-silver text-sm mt-1">
            {totalCount} ürün · {categories.length} kategori
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-dim text-void font-display font-semibold text-sm rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Ürün Ekle
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ürün ara..."
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 font-body text-sm text-snow placeholder-silver/40 focus:outline-none focus:border-gold/40 transition-colors"
        />
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-7 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-snow text-lg font-semibold mb-6">
              {editing ? 'Ürün Düzenle' : 'Yeni Ürün'}
            </h2>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs text-silver uppercase tracking-widest">Kategori</label>
                <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors">
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs text-silver uppercase tracking-widest">Ürün Adı</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs text-silver uppercase tracking-widest">Açıklama (opsiyonel)</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs text-silver uppercase tracking-widest">Normal Fiyat (TL)</label>
                  <input type="number" required min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors" placeholder="0.00" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs text-silver uppercase tracking-widest">İndirimli Fiyat</label>
                  <input type="number" min="0" step="0.01" value={form.discountedPrice} onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })} className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs text-silver uppercase tracking-widest">Hazırlama (dk)</label>
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
                  {ALLERGEN_LIST.map((a) => (
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
                label="Fotoğraf (opsiyonel)"
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
              />

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="w-4 h-4 accent-gold" />
                <span className="font-body text-silver text-sm">Satışta mevcut</span>
              </label>

              {error && <p className="font-body text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-border text-silver font-body text-sm rounded-lg hover:bg-elevated transition-colors">İptal</button>
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
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((cat) => {
            const catProducts = products
              .filter((p) => p.category.id === cat.id)
              .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));
            const isExpanded = expandedCats.has(cat.id);
            const allCatProducts = products.filter((p) => p.category.id === cat.id);

            if (search && catProducts.length === 0) return null;

            return (
              <div key={cat.id} className="bg-surface border border-border rounded-2xl overflow-hidden">
                {/* Category header */}
                <button
                  onClick={() => toggleCat(cat.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-elevated/50 transition-colors"
                >
                  <svg className="w-4 h-4 text-silver/60 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7a2 2 0 012-2h3.172a2 2 0 011.414.586l1.828 1.828A2 2 0 0012.828 8H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  </svg>
                  <span className="font-display text-snow font-semibold text-sm flex-1 text-left">{cat.name}</span>
                  <span className="font-body text-silver/60 text-xs">{allCatProducts.length}</span>
                  <svg
                    className={`w-4 h-4 text-silver/50 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* Products */}
                <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    className="border-t border-border overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                  >
                    {catProducts.length === 0 ? (
                      <p className="font-body text-silver/50 text-sm px-5 py-4">Bu kategoride ürün yok.</p>
                    ) : (
                      catProducts.map((p, pi) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: pi * 0.03, duration: 0.18 }}
                          draggable
                          onDragStart={() => onDragStart(p.id)}
                          onDragEnter={() => onDragEnter(p.id)}
                          onDragEnd={onDragEnd}
                          onDragOver={(e) => e.preventDefault()}
                          className={`flex items-center gap-3 px-5 py-3 border-b border-border/50 last:border-b-0 transition-colors ${
                            dragging === p.id ? 'opacity-40 bg-gold/5' : 'hover:bg-elevated/40'
                          }`}
                        >
                          {/* Drag handle */}
                          <div className="text-silver/25 flex-shrink-0 cursor-grab active:cursor-grabbing select-none">
                            <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor">
                              <circle cx="3" cy="3" r="1.5"/><circle cx="9" cy="3" r="1.5"/>
                              <circle cx="3" cy="9" r="1.5"/><circle cx="9" cy="9" r="1.5"/>
                              <circle cx="3" cy="15" r="1.5"/><circle cx="9" cy="15" r="1.5"/>
                            </svg>
                          </div>

                          {/* Image */}
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-elevated flex-shrink-0 flex items-center justify-center">
                              <svg className="w-5 h-5 text-silver/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                              </svg>
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-body text-snow text-sm font-medium truncate">{p.name}</p>
                              {!p.isAvailable && (
                                <span className="px-1.5 py-0.5 bg-red-900/30 text-red-400 text-[10px] rounded-full font-body flex-shrink-0">Pasif</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {p.discountedPrice ? (
                                <>
                                  <span className="font-body text-silver/40 text-xs line-through">{Number(p.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                  <span className="font-display text-gold text-xs font-semibold">{Number(p.discountedPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                </>
                              ) : (
                                <span className="font-display text-gold text-xs font-semibold">{Number(p.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                              )}
                              {p.preparationTime && <span className="font-body text-silver/40 text-xs">{p.preparationTime} dk</span>}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Tooltip content={p.isAvailable ? 'Pasifleştir' : 'Aktifleştir'}>
                              <button
                                onClick={() => toggleAvailable(p)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                                  p.isAvailable ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-silver/40 hover:bg-elevated'
                                }`}
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  {p.isAvailable
                                    ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                                    : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                                  }
                                </svg>
                              </button>
                            </Tooltip>
                            <Tooltip content="Düzenle">
                              <button
                                onClick={() => openEdit(p)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-silver/60 hover:text-snow hover:bg-elevated transition-colors"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                            </Tooltip>
                            <Tooltip content="Sil">
                              <button
                                onClick={() => setConfirmId(p.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                                </svg>
                              </button>
                            </Tooltip>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            );
          })}

          {categories.length === 0 && (
            <div className="border border-dashed border-border rounded-2xl py-16 text-center">
              <p className="font-body text-silver">Henüz kategori yok. Önce kategori ekleyin.</p>
            </div>
          )}
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
