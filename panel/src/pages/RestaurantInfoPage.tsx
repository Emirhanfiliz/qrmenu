import { useEffect, useState } from 'react';
import { api } from '../api';
import ImageUpload from '../components/ImageUpload';

type Info = {
  logoUrl: string;
  coverUrl: string;
  tagline: string;
  address: string;
  phone: string;
  workingHours: string;
  wifiInfo: string;
  instagramUrl: string;
  tiktokUrl: string;
  googleMapsUrl: string;
  googlePlaceId: string;
};

export default function RestaurantInfoPage() {
  const [info, setInfo] = useState<Info>({
    logoUrl: '', coverUrl: '', tagline: '', address: '',
    phone: '', workingHours: '', wifiInfo: '',
    instagramUrl: '', tiktokUrl: '', googleMapsUrl: '', googlePlaceId: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [placeSearch, setPlaceSearch] = useState('');
  const [placeResults, setPlaceResults] = useState<{ placeId: string; name: string; address: string }[]>([]);
  const [placeSearching, setPlaceSearching] = useState(false);

  useEffect(() => {
    api.get('/restaurant/design').then((data: any) => {
      setInfo({
        logoUrl: data.logoUrl ?? '',
        coverUrl: data.coverUrl ?? '',
        tagline: data.tagline ?? '',
        address: data.address ?? '',
        phone: data.phone ?? '',
        workingHours: data.workingHours ?? '',
        wifiInfo: data.wifiInfo ?? '',
        instagramUrl: data.instagramUrl ?? '',
        tiktokUrl: data.tiktokUrl ?? '',
        googleMapsUrl: data.googleMapsUrl ?? '',
        googlePlaceId: data.googlePlaceId ?? '',
      });
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.patch('/restaurant/design', info);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const searchPlace = async () => {
    if (!placeSearch.trim()) return;
    setPlaceSearching(true);
    setPlaceResults([]);
    try {
      const results = await api.get(`/restaurant/places-search?q=${encodeURIComponent(placeSearch)}`);
      setPlaceResults(results);
    } catch { /* ignore */ }
    finally { setPlaceSearching(false); }
  };

  const inputCls = 'w-full bg-elevated border border-border rounded-lg px-4 py-2.5 font-body text-snow text-sm focus:outline-none focus:border-gold/50 transition-colors';

  const field = (label: string, key: keyof Info, placeholder: string) => (
    <div>
      <label className="font-body text-xs text-silver uppercase tracking-widest block mb-1.5">{label}</label>
      <input
        type="text"
        value={info[key] as string}
        onChange={(e) => setInfo({ ...info, [key]: e.target.value })}
        placeholder={placeholder}
        className={inputCls}
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-snow font-semibold">Restoran Bilgileri</h1>
        <p className="font-body text-silver text-sm mt-1">Görsel, iletişim ve sosyal medya bilgilerinizi yönetin.</p>
      </div>

      {/* Görseller */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-5">
        <p className="font-body text-xs text-silver uppercase tracking-widest mb-5">Görseller</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <ImageUpload label="Logo" value={info.logoUrl} onChange={(url) => setInfo({ ...info, logoUrl: url })} />
            {info.logoUrl && (
              <img src={info.logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-xl bg-elevated border border-border p-2 mx-auto" />
            )}
            <p className="font-body text-xs text-silver/50 text-center">Karşılama ekranı ve sidebar'da görünür</p>
          </div>
          <div className="flex flex-col gap-3">
            <ImageUpload label="Banner (Hero Arkaplan)" value={info.coverUrl} onChange={(url) => setInfo({ ...info, coverUrl: url })} />
            {info.coverUrl && (
              <img src={info.coverUrl} alt="Banner" className="w-full h-16 object-cover rounded-xl border border-border" />
            )}
            <p className="font-body text-xs text-silver/50 text-center">Menü açılış hero bölümünün arkaplanı</p>
          </div>
        </div>
      </div>

      {/* İletişim */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-5">
        <p className="font-body text-xs text-silver uppercase tracking-widest mb-5">İletişim & Detaylar</p>
        <div className="flex flex-col gap-4">
          {field('Slogan', 'tagline', 'Lezzetin yeni adresi')}
          {field('Adres', 'address', 'Örnek Cad. No:1, İstanbul')}
          {field('Telefon', 'phone', '0212 999 88 77')}
          {field('Çalışma Saatleri', 'workingHours', '09:00 - 23:00')}
          {field('Wi-Fi', 'wifiInfo', 'Şifre: cafe2025')}
        </div>
      </div>

      {/* Sosyal medya */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-5">
        <p className="font-body text-xs text-silver uppercase tracking-widest mb-5">Sosyal Medya & Yorumlar</p>
        <div className="flex flex-col gap-4">
          {field('Instagram', 'instagramUrl', 'https://instagram.com/restoraniniz')}
          {field('TikTok', 'tiktokUrl', 'https://tiktok.com/@restoraniniz')}
          {field('Google Maps URL', 'googleMapsUrl', 'https://maps.google.com/...')}
          <div>
            <label className="font-body text-xs text-silver uppercase tracking-widest block mb-1.5">Google Yorum ID (Place ID)</label>
            <input
              type="text"
              value={info.googlePlaceId}
              onChange={(e) => setInfo({ ...info, googlePlaceId: e.target.value })}
              placeholder="ChIJxxxxxxxxxxxxxxxxxx"
              className={inputCls + ' mb-2'}
            />
            {info.googlePlaceId && (
              <a href={`https://search.google.com/local/writereview?placeid=${info.googlePlaceId}`} target="_blank" rel="noopener noreferrer" className="font-body text-xs text-gold/70 hover:text-gold transition-colors">
                Yorum linkini test et →
              </a>
            )}
            <div className="mt-3 p-3 bg-elevated border border-border rounded-xl">
              <p className="font-body text-xs text-silver mb-2">Place ID'yi otomatik bul</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={placeSearch}
                  onChange={(e) => setPlaceSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchPlace()}
                  placeholder="Restoran adı ve şehir..."
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 font-body text-sm text-snow placeholder-silver/40 focus:outline-none focus:border-gold/50 transition-colors"
                />
                <button type="button" onClick={searchPlace} disabled={placeSearching} className="px-4 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold text-sm font-body rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap">
                  {placeSearching ? '...' : 'Ara'}
                </button>
              </div>
              {placeResults.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {placeResults.map((r) => (
                    <button key={r.placeId} type="button" onClick={() => { setInfo({ ...info, googlePlaceId: r.placeId }); setPlaceResults([]); }} className="text-left p-2.5 bg-surface hover:bg-gold/8 border border-border rounded-lg transition-colors">
                      <p className="font-body text-sm text-snow">{r.name}</p>
                      <p className="font-body text-xs text-silver mt-0.5">{r.address}</p>
                      <p className="font-body text-xs text-gold/60 mt-0.5">{r.placeId}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="w-full py-3 bg-gold hover:bg-gold-dim disabled:opacity-50 text-void font-display font-semibold rounded-lg transition-colors">
        {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi ✓' : 'Kaydet'}
      </button>
    </div>
  );
}
