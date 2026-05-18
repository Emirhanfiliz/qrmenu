import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const MENU_BASE = import.meta.env.VITE_MENU_BASE || 'http://localhost:5173';

type Design = {
  theme: string;
  showWelcome: boolean;
};

const THEMES = [
  {
    id: 'beach',
    name: 'Beach',
    desc: 'Deniz mavisi, kumsal tonları. Sidebar, 2 sütunlu kart grid.',
    accent: '#0db5af',
    bg: '#1a3535',
  },
  {
    id: 'new21',
    name: 'Modern',
    desc: 'Koyu header, altın aksanlar, yuvarlak kategori chipları, karşılama animasyonu.',
    accent: '#e8b84b',
    bg: '#0f0f1a',
  },
];

export default function DesignPage() {
  const { restaurant } = useAuth();
  const [design, setDesign] = useState<Design>({ theme: 'beach', showWelcome: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    api.get('/restaurant/design').then((data: any) => {
      setDesign({ theme: data.theme ?? 'beach', showWelcome: data.showWelcome ?? false });
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError('');
    try {
      await api.patch('/restaurant/design', design);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-gold/50 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-snow font-semibold">Tasarım</h1>
          <p className="font-body text-silver text-sm mt-1">Menünüzün görsel temasını seçin.</p>
        </div>
        {restaurant?.slug && (
          <a
            href={`${MENU_BASE}/${restaurant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-border text-silver hover:text-snow hover:border-silver text-sm font-body rounded-lg transition-colors"
          >
            Önizle
          </a>
        )}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <p className="font-body text-xs text-silver uppercase tracking-widest mb-4">Tema</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setDesign({ ...design, theme: t.id })}
              className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                design.theme === t.id ? 'border-gold bg-gold/8' : 'border-border bg-elevated hover:border-silver/30'
              }`}
            >
              {/* Mini önizleme */}
              <div className="w-full h-20 rounded-lg mb-3 overflow-hidden relative" style={{ background: t.bg }}>
                <div className="h-5 flex items-center px-2 gap-1.5" style={{ background: t.bg, filter: 'brightness(0.7)' }}>
                  <div className="w-2 h-2 rounded-sm bg-white/20" />
                  <div className="flex-1 flex justify-center">
                    <div className="w-10 h-1.5 rounded-full bg-white/30" />
                  </div>
                  <div className="w-2 h-2 rounded-sm bg-white/20" />
                </div>
                <div className="flex gap-1 px-2 py-1">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="w-5 h-5 rounded-full" style={{ background: n === 1 ? t.accent : 'rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-1 px-2">
                  {[1, 2, 3].map((n) => <div key={n} className="h-6 rounded bg-white/10" />)}
                </div>
              </div>
              <p className="font-display text-sm text-snow font-semibold mb-0.5">{t.name}</p>
              <p className="font-body text-xs text-silver leading-relaxed">{t.desc}</p>
              {design.theme === t.id && (
                <div className="mt-2 flex items-center gap-1 text-gold text-xs font-body font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" /> Aktif
                </div>
              )}
            </button>
          ))}
        </div>

        {design.theme === 'new21' && (
          <label className="flex items-center gap-3 mt-4 cursor-pointer">
            <div
              onClick={() => setDesign({ ...design, showWelcome: !design.showWelcome })}
              className={`w-10 h-6 rounded-full transition-colors relative ${design.showWelcome ? 'bg-gold' : 'bg-border'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${design.showWelcome ? 'left-5' : 'left-1'}`} />
            </div>
            <div>
              <p className="font-body text-sm text-snow">Karşılama ekranı (kapı animasyonu)</p>
              <p className="font-body text-xs text-silver">Müşteri ilk girişte animasyonlu kapı görecek</p>
            </div>
          </label>
        )}
      </div>

      <p className="font-body text-xs text-silver/50 text-center mb-4">
        Logo, banner ve restoran bilgileri için{' '}
        <a href="/account" className="text-gold/70 hover:text-gold transition-colors">Hesap Bilgileri</a>
        {' '}sayfasına gidin.
      </p>

      {saveError && <p className="font-body text-red-400 text-sm mb-3">{saveError}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 bg-gold hover:bg-gold-dim disabled:opacity-50 text-void font-display font-semibold rounded-lg transition-colors"
      >
        {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi ✓' : 'Temayı Kaydet'}
      </button>
    </div>
  );
}
