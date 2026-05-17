import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';

const MENU_BASE = import.meta.env.VITE_MENU_BASE || 'http://localhost:5173';

type Design = {
  theme: string;
  tagline: string;
  coverUrl: string;
  address: string;
  phone: string;
  workingHours: string;
  wifiInfo: string;
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
  const [design, setDesign] = useState<Design>({
    theme: 'beach',
    tagline: '',
    coverUrl: '',
    address: '',
    phone: '',
    workingHours: '',
    wifiInfo: '',
    showWelcome: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    api.get('/restaurant/design').then((data: Design) => {
      setDesign({
        theme: data.theme ?? 'beach',
        tagline: data.tagline ?? '',
        coverUrl: data.coverUrl ?? '',
        address: data.address ?? '',
        phone: data.phone ?? '',
        workingHours: data.workingHours ?? '',
        wifiInfo: data.wifiInfo ?? '',
        showWelcome: data.showWelcome ?? false,
      });
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

  const field = (label: string, key: keyof Omit<Design, 'theme' | 'showWelcome' | 'coverUrl'>, placeholder: string) => (
    <div>
      <label className="font-body text-xs text-silver uppercase tracking-widest block mb-1.5">{label}</label>
      <input
        type="text"
        value={design[key] as string}
        onChange={(e) => setDesign({ ...design, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 font-body text-sm text-snow placeholder-silver/40 focus:outline-none focus:border-gold/50 transition-colors"
      />
    </div>
  );

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
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-snow font-semibold">Tasarim</h1>
          <p className="font-body text-silver text-sm mt-1">Menunuzun gorsel temasini ve bilgilerini ayarlayin.</p>
        </div>
        {restaurant?.slug && (
          <a
            href={`${MENU_BASE}/${restaurant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-border text-silver hover:text-snow hover:border-silver text-sm font-body rounded-lg transition-colors"
          >
            Onizle
          </a>
        )}
      </div>

      {/* Theme selector */}
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
              {/* Mini preview */}
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

        {/* Welcome toggle (only for Modern theme) */}
        {design.theme === 'new21' && (
          <label className="flex items-center gap-3 mt-4 cursor-pointer">
            <div
              onClick={() => setDesign({ ...design, showWelcome: !design.showWelcome })}
              className={`w-10 h-6 rounded-full transition-colors relative ${design.showWelcome ? 'bg-gold' : 'bg-border'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${design.showWelcome ? 'left-5' : 'left-1'}`} />
            </div>
            <div>
              <p className="font-body text-sm text-snow">Karsılama ekranı (kapi animasyonu)</p>
              <p className="font-body text-xs text-silver">Musteri ilk giriste animasyonlu kapi gorecek</p>
            </div>
          </label>
        )}
      </div>

      {/* Info + images */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <p className="font-body text-xs text-silver uppercase tracking-widest mb-4">Restoran Bilgileri</p>
        <div className="flex flex-col gap-4">
          {field('Slogan', 'tagline', 'Lezzetin yeni adresi')}
          <ImageUpload
            label="Kapak Fotografi (hero arkaplan)"
            value={design.coverUrl}
            onChange={(url) => setDesign({ ...design, coverUrl: url })}
          />
          {field('Adres', 'address', 'Ornek Cad. No:1, Istanbul')}
          {field('Telefon', 'phone', '0212 999 88 77')}
          {field('Calisma Saatleri', 'workingHours', '09:00 - 23:00')}
          {field('Wi-Fi', 'wifiInfo', 'Sifre: cafe2025')}
        </div>
      </div>

      {saveError && (
        <p className="font-body text-red-400 text-sm mb-3">{saveError}</p>
      )}
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 bg-gold hover:bg-gold-dim disabled:opacity-50 text-void font-display font-semibold rounded-lg transition-colors"
      >
        {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi' : 'Kaydet'}
      </button>
    </div>
  );
}
