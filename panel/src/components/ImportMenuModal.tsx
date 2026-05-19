import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { analyzeMenuPhoto, api } from '../api';
import { toast } from '../lib/toast';

type ExtractedProduct = {
  name: string;
  description: string;
  price: number;
  selected: boolean;
};

type ExtractedCategory = {
  name: string;
  products: ExtractedProduct[];
  selected: boolean;
  expanded: boolean;
};

type Props = {
  onClose: () => void;
  onImported: () => void;
};

type Step = 'upload' | 'analyzing' | 'preview' | 'importing';

export default function ImportMenuModal({ onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [preview, setPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<ExtractedCategory[]>([]);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setStep('analyzing');
    try {
      const result = await analyzeMenuPhoto(file);
      setCategories(
        result.categories.map((c) => ({
          name: c.name,
          selected: true,
          expanded: true,
          products: c.products.map((p) => ({ ...p, selected: true })),
        })),
      );
      setStep('preview');
    } catch (err: any) {
      setError(err.message);
      setStep('upload');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const updateCat = (ci: number, patch: Partial<ExtractedCategory>) =>
    setCategories((prev) => prev.map((c, i) => (i === ci ? { ...c, ...patch } : c)));

  const updateProd = (ci: number, pi: number, patch: Partial<ExtractedProduct>) =>
    setCategories((prev) =>
      prev.map((c, i) =>
        i === ci ? { ...c, products: c.products.map((p, j) => (j === pi ? { ...p, ...patch } : p)) } : c,
      ),
    );

  const counts = categories.reduce(
    (acc, c) => ({
      cats: acc.cats + (c.selected ? 1 : 0),
      prods: acc.prods + (c.selected ? c.products.filter((p) => p.selected).length : 0),
    }),
    { cats: 0, prods: 0 },
  );

  const handleImport = async () => {
    setStep('importing');
    try {
      for (const cat of categories) {
        if (!cat.selected) continue;
        const created = await api.post('/categories', { name: cat.name });
        for (const prod of cat.products.filter((p) => p.selected)) {
          await api.post('/products', {
            categoryId: created.id,
            name: prod.name,
            ...(prod.description ? { description: prod.description } : {}),
            price: prod.price,
          });
        }
      }
      toast('Menü başarıyla içe aktarıldı.');
      onImported();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setStep('preview');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
            <div>
              <h2 className="font-display text-snow text-lg font-semibold">Fotoğraftan İçe Aktar</h2>
              <p className="font-body text-silver text-xs mt-0.5">
                Menü fotoğrafını yükle, AI kategori ve ürünleri otomatik tanısın
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-silver hover:text-snow rounded-lg hover:bg-elevated transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            {/* Upload */}
            {step === 'upload' && (
              <div className="p-6">
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => inputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-colors ${
                    dragOver ? 'border-gold/60 bg-gold/5' : 'border-border hover:border-gold/30'
                  }`}
                >
                  <svg
                    className="w-12 h-12 text-silver/40 mx-auto mb-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="font-body text-snow text-sm font-medium">Menü fotoğrafını buraya sürükle</p>
                  <p className="font-body text-silver text-xs mt-1">veya tıklayarak seç · JPG, PNG, WEBP · max 10MB</p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                </div>
                {error && <p className="font-body text-red-400 text-sm mt-3 text-center">{error}</p>}
              </div>
            )}

            {/* Analyzing */}
            {(step === 'analyzing' || step === 'importing') && (
              <div className="p-12 flex flex-col items-center gap-5">
                {preview && step === 'analyzing' && (
                  <img src={preview} alt="" className="w-28 h-28 object-cover rounded-xl border border-border opacity-50" />
                )}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  <p className="font-body text-silver text-sm">
                    {step === 'analyzing' ? 'Menü analiz ediliyor...' : 'Oluşturuluyor...'}
                  </p>
                  {step === 'analyzing' && (
                    <p className="font-body text-silver/40 text-xs">Bu 10–20 saniye sürebilir</p>
                  )}
                </div>
              </div>
            )}

            {/* Preview */}
            {step === 'preview' && (
              <div className="p-4 flex flex-col gap-2">
                {error && <p className="font-body text-red-400 text-sm px-2 mb-1">{error}</p>}
                {categories.map((cat, ci) => (
                  <div key={ci} className="bg-elevated border border-border rounded-xl overflow-hidden">
                    {/* Category header */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={cat.selected}
                        onChange={(e) => updateCat(ci, { selected: e.target.checked })}
                        className="w-4 h-4 accent-yellow-400 cursor-pointer flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => updateCat(ci, { name: e.target.value })}
                        className="flex-1 bg-transparent font-display text-snow font-semibold text-sm focus:outline-none border-b border-transparent focus:border-gold/40 transition-colors"
                      />
                      <span className="font-body text-silver/50 text-xs flex-shrink-0">
                        {cat.products.filter((p) => p.selected).length} ürün
                      </span>
                      <button
                        onClick={() => updateCat(ci, { expanded: !cat.expanded })}
                        className="text-silver hover:text-snow transition-colors"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          style={{ transform: cat.expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                        >
                          <path d="M2 5l5 5 5-5" />
                        </svg>
                      </button>
                    </div>

                    {/* Products */}
                    {cat.expanded && cat.products.length > 0 && (
                      <div className="border-t border-border divide-y divide-border/60">
                        {cat.products.map((prod, pi) => (
                          <div
                            key={pi}
                            className={`flex items-start gap-3 px-4 py-2.5 transition-opacity ${!prod.selected ? 'opacity-40' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={prod.selected}
                              onChange={(e) => updateProd(ci, pi, { selected: e.target.checked })}
                              className="w-3.5 h-3.5 mt-1 accent-yellow-400 cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                value={prod.name}
                                onChange={(e) => updateProd(ci, pi, { name: e.target.value })}
                                className="w-full bg-transparent font-body text-snow text-sm focus:outline-none border-b border-transparent focus:border-gold/40 transition-colors"
                              />
                              {prod.description && (
                                <input
                                  type="text"
                                  value={prod.description}
                                  onChange={(e) => updateProd(ci, pi, { description: e.target.value })}
                                  className="w-full bg-transparent font-body text-silver/50 text-xs focus:outline-none border-b border-transparent focus:border-gold/40 transition-colors mt-0.5"
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <input
                                type="number"
                                value={prod.price}
                                onChange={(e) => updateProd(ci, pi, { price: parseFloat(e.target.value) || 0 })}
                                className="w-16 bg-transparent font-body text-gold text-sm text-right focus:outline-none border-b border-transparent focus:border-gold/40 transition-colors"
                              />
                              <span className="font-body text-silver/50 text-xs">₺</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {step === 'preview' && (
            <div className="p-4 border-t border-border flex items-center justify-between gap-3 flex-shrink-0">
              <p className="font-body text-silver text-xs">
                <span className="text-snow">{counts.cats}</span> kategori ·{' '}
                <span className="text-snow">{counts.prods}</span> ürün seçili
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-border text-silver font-body text-sm rounded-lg hover:bg-elevated transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleImport}
                  disabled={counts.cats === 0}
                  className="px-4 py-2 bg-gold hover:bg-gold-dim text-void font-display font-semibold text-sm rounded-lg transition-colors disabled:opacity-40"
                >
                  İçe Aktar
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
