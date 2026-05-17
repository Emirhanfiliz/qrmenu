import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMenu } from '../api';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
};

type Category = {
  id: string;
  name: string;
  imageUrl: string | null;
  products: Product[];
};

type Announcement = {
  id: string;
  title: string;
  body: string;
};

type MenuData = {
  id: string;
  name: string;
  logoUrl: string | null;
  theme: string;
  tagline: string | null;
  coverUrl: string | null;
  address: string | null;
  phone: string | null;
  workingHours: string | null;
  wifiInfo: string | null;
  showWelcome: boolean;
  categories: Category[];
  announcements: Announcement[];
};

const THEME_MAP: Record<string, string> = {
  beach: '/themes/beach.html',
  new21: '/themes/new21.html',
};

export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [themeSrc, setThemeSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeReady = useRef(false);

  const inject = (data: MenuData) => {
    const win = iframeRef.current?.contentWindow as any;
    if (typeof win?.render !== 'function') return;
    win.render({
      name: data.name,
      heroImage: data.coverUrl || data.logoUrl || '',
      logoUrl: data.logoUrl ?? '',
      tagline: data.tagline ?? '',
      show_welcome: data.showWelcome,
      info: {
        hours: data.workingHours ?? '',
        address: data.address ?? '',
        phone: data.phone ?? '',
        wifi: data.wifiInfo ?? '',
      },
      announcements: data.announcements.map((a) => ({ title: a.title, body: a.body })),
      menu: data.categories.map((cat) => ({
        catId: cat.id,
        cat: cat.name,
        catImage: cat.imageUrl ?? '',
        items: cat.products.map((p) => ({
          name: p.name,
          price: Number(p.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL',
          desc: p.description ?? '',
          image: p.imageUrl ?? '',
          ing: '',
          alg: '',
        })),
      })),
    });
  };

  useEffect(() => {
    if (!slug) return;
    getMenu(slug)
      .then((data) => {
        setMenuData(data);
        const src = THEME_MAP[data.theme ?? 'beach'] ?? THEME_MAP.beach;
        setThemeSrc(src);
      })
      .catch(() => setError(true));
  }, [slug]);

  const handleIframeLoad = () => {
    iframeReady.current = true;
    if (menuData) inject(menuData);
  };

  useEffect(() => {
    if (menuData && iframeReady.current) inject(menuData);
  }, [menuData]);

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
    </>
  );
}
