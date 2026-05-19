import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { type MenuData, type MenuError, getMenu, recordScan } from '../api';

const THEME_MAP: Record<string, string> = {
  beach: '/themes/beach.html',
  new21: '/themes/new21.html',
};

const formatPrice = (val: string) =>
  Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL';

const parseAllergens = (raw: string | null): string[] => {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
};

function inject(iframeRef: React.RefObject<HTMLIFrameElement | null>, data: MenuData) {
  const win = iframeRef.current?.contentWindow as any;
  if (typeof win?.render !== 'function') return;
  win.render({
    name: data.name,
    heroImage: data.coverUrl || data.logoUrl || '',
    logoUrl: data.logoUrl ?? '',
    tagline: data.tagline ?? '',
    show_welcome: data.showWelcome,
    instagram: data.instagramUrl ?? '',
    tiktok: data.tiktokUrl ?? '',
    map_link: data.googleMapsUrl ?? '',
    google_place_id: data.googlePlaceId ?? '',
    info: {
      hours: data.workingHours ?? '',
      address: data.address ?? '',
      phone: data.phone ?? '',
      wifi: data.wifiInfo ?? '',
    },
    announcements: data.announcements.map((a) => ({ title: a.title, body: a.body, image: a.imageUrl ?? '' })),
    menu: data.categories.map((cat) => ({
      catId: cat.id,
      cat: cat.name,
      catImage: cat.imageUrl ?? '',
      items: cat.products.map((p) => ({
        name: p.name,
        price: formatPrice(p.price),
        discountedPrice: p.discountedPrice ? formatPrice(p.discountedPrice) : '',
        preparationTime: p.preparationTime ? `${p.preparationTime} dk` : '',
        calories: p.calories ? `${p.calories} kcal` : '',
        desc: p.description ?? '',
        image: p.imageUrl ?? '',
        ing: '',
        alg: parseAllergens(p.allergens).join(', '),
        cal: p.calories ? String(p.calories) : '',
      })),
    })),
  });
}

export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [themeSrc, setThemeSrc] = useState<string | null>(null);
  const [error, setError] = useState<MenuError | null>(null);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeReady = useRef(false);
  const announcementsShown = useRef(false);

  const maybeShowAnnouncements = (data: MenuData) => {
    if (!announcementsShown.current && data.announcements.length > 0) {
      announcementsShown.current = true;
      setShowAnnouncements(true);
    }
  };

  useEffect(() => {
    if (!slug) return;
    getMenu(slug).then((result) => {
      if ('error' in result) {
        setError(result.error);
        return;
      }
      const data = result.data;
      setMenuData(data);
      setThemeSrc(THEME_MAP[data.theme ?? 'beach'] ?? THEME_MAP.beach);
      recordScan(slug);
    });
  }, [slug]);

  const handleIframeLoad = () => {
    iframeReady.current = true;
    if (menuData) {
      inject(iframeRef, menuData);
      maybeShowAnnouncements(menuData);
    }
  };

  useEffect(() => {
    if (menuData && iframeReady.current) {
      inject(iframeRef, menuData);
      maybeShowAnnouncements(menuData);
    }
  }, [menuData]);

  if (error === 'SUBSCRIPTION_EXPIRED') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#f5ede0]">
        <svg className="w-12 h-12 text-[#1a3535]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
        </svg>
        <p className="text-xl font-semibold text-[#1a3535]">Menü şu an kullanılamıyor</p>
        <p className="text-sm text-[#1a3535]/60 text-center max-w-xs">Bu restoranın dijital menüsü geçici olarak devre dışı. Lütfen daha sonra tekrar deneyin.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#f5ede0]">
        <p className="text-2xl font-semibold text-[#1a3535]">Menü bulunamadı</p>
        <p className="text-sm text-[#1a3535]/60">Bu QR kodu geçersiz veya süresi dolmuş.</p>
      </div>
    );
  }

  return (
    <>
      {!themeSrc && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#f8f5f0] z-50">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#e8b84b]"
                style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
        </div>
      )}

      {themeSrc && (
        <iframe
          ref={iframeRef}
          src={themeSrc}
          onLoad={handleIframeLoad}
          title={menuData?.name ?? 'Menu'}
          style={{ width: '100vw', height: '100vh', border: 'none', display: 'block' }}
        />
      )}

      {showAnnouncements && menuData && menuData.announcements.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: '#fff', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {menuData.announcements.map((a, i) => (
                <div key={a.id}>
                  {a.imageUrl && (
                    <img
                      src={a.imageUrl}
                      alt={a.title}
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  <div style={{ padding: '20px', borderBottom: i < menuData.announcements.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                    <p style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a1a', margin: 0 }}>{a.title}</p>
                    <p style={{ fontSize: '14px', color: '#555', marginTop: '6px', lineHeight: 1.5 }}>{a.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', background: '#fff', flexShrink: 0 }}>
              <button
                onClick={() => setShowAnnouncements(false)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#1a1a1a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
