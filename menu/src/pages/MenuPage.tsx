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

type Menu = {
  id: string;
  name: string;
  logoUrl: string | null;
  categories: Category[];
  announcements: Announcement[];
};

export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [error, setError] = useState(false);
  const [activeId, setActiveId] = useState('');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!slug) return;
    getMenu(slug)
      .then((data) => {
        setMenu(data);
        if (data.categories.length > 0) setActiveId(data.categories[0].id);
      })
      .catch(() => setError(true));
  }, [slug]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [menu]);

  const scrollToCategory = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveId(id);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-px bg-terra" />
        <p className="font-display text-2xl text-charcoal italic">Menü bulunamadı</p>
        <p className="font-body text-muted text-sm">Bu QR kodu geçersiz veya süresi dolmuş.</p>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-terra"
              style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="pt-12 pb-8 px-6 text-center border-b border-charcoal/10">
        {menu.logoUrl && (
          <img
            src={menu.logoUrl}
            alt={menu.name}
            className="w-20 h-20 object-cover rounded-full mx-auto mb-5 ring-2 ring-terra/20"
          />
        )}
        <h1 className="font-display text-4xl font-light tracking-wide text-charcoal">
          {menu.name}
        </h1>
        <div className="w-8 h-px bg-terra mx-auto mt-4" />
      </header>

      {/* Announcements */}
      {menu.announcements.length > 0 && (
        <div className="px-4 pt-6">
          {menu.announcements.map((a) => (
            <div
              key={a.id}
              className="bg-terra/8 border-l-2 border-terra rounded-r-lg px-5 py-4 mb-3"
            >
              <p className="font-body font-medium text-terra text-sm uppercase tracking-widest mb-1">
                {a.title}
              </p>
              <p className="font-body text-charcoal/80 text-sm leading-relaxed">{a.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Category Nav */}
      {menu.categories.length > 0 && (
        <nav className="sticky top-0 z-20 bg-cream/95 backdrop-blur-sm border-b border-charcoal/8 px-4 py-3">
          <div className="category-nav flex gap-2 overflow-x-auto">
            {menu.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-body font-medium transition-all duration-200 ${
                  activeId === cat.id
                    ? 'bg-terra text-white shadow-sm'
                    : 'bg-charcoal/6 text-charcoal/70 hover:bg-charcoal/10'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Menu Content */}
      <main className="max-w-2xl mx-auto px-4 pb-24">
        {menu.categories.map((cat) => (
          <section
            key={cat.id}
            id={cat.id}
            ref={(el) => { sectionRefs.current[cat.id] = el; }}
            className="pt-10"
          >
            {/* Category Header */}
            <div className="flex items-center gap-4 mb-6">
              {cat.imageUrl && (
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              )}
              <div>
                <h2 className="font-display text-2xl font-light text-charcoal italic">
                  {cat.name}
                </h2>
                <div className="w-6 h-px bg-terra mt-1" />
              </div>
            </div>

            {/* Products */}
            <div className="flex flex-col gap-3">
              {cat.products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-charcoal/6 flex gap-0"
                >
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-24 h-24 object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 px-4 py-3 flex flex-col justify-between min-w-0">
                    <div>
                      <p className="font-body font-medium text-charcoal text-[15px] leading-tight">
                        {product.name}
                      </p>
                      {product.description && (
                        <p className="font-body text-muted text-xs mt-1 leading-relaxed line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <p className="font-display text-terra font-medium text-lg mt-2">
                      {Number(product.price).toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      <span className="text-sm">TL</span>
                    </p>
                  </div>
                </div>
              ))}

              {cat.products.length === 0 && (
                <p className="font-body text-muted text-sm italic text-center py-4">
                  Bu kategoride henüz ürün yok.
                </p>
              )}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
