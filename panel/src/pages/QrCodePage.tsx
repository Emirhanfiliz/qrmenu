import { useRef, useState } from 'react';
import { QRCode as QRCodeSVG } from 'react-qr-code';
import { useAuth } from '../context/AuthContext';
import { toast } from '../lib/toast';

const MENU_BASE = import.meta.env.VITE_MENU_BASE || 'http://localhost:5173';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function QrCodePage() {
  const { restaurant } = useAuth();
  const svgRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  if (!restaurant) return null;

  const menuUrl = `${MENU_BASE}/${restaurant.slug}`;
  const shareUrl = `${API_BASE}/menu/${restaurant.slug}/og`;

  const downloadSvg = () => {
    const qrEl = svgRef.current?.querySelector('svg');
    if (!qrEl) return;

    const padding = 56;
    const qrSize = 220;
    const totalW = qrSize + padding * 2;
    const labelH = 52;
    const totalH = qrSize + padding * 2 + labelH;

    const qrClone = qrEl.cloneNode(true) as SVGElement;
    qrClone.setAttribute('x', String(padding));
    qrClone.setAttribute('y', String(padding));
    qrClone.setAttribute('width', String(qrSize));
    qrClone.setAttribute('height', String(qrSize));

    const ns = 'http://www.w3.org/2000/svg';
    const wrapper = document.createElementNS(ns, 'svg');
    wrapper.setAttribute('xmlns', ns);
    wrapper.setAttribute('width', String(totalW));
    wrapper.setAttribute('height', String(totalH));
    wrapper.setAttribute('viewBox', `0 0 ${totalW} ${totalH}`);

    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('width', String(totalW));
    bg.setAttribute('height', String(totalH));
    bg.setAttribute('fill', '#ffffff');
    wrapper.appendChild(bg);

    wrapper.appendChild(qrClone);

    const name = document.createElementNS(ns, 'text');
    name.setAttribute('x', String(totalW / 2));
    name.setAttribute('y', String(totalH - labelH / 2 - 4));
    name.setAttribute('text-anchor', 'middle');
    name.setAttribute('font-family', 'sans-serif');
    name.setAttribute('font-size', '16');
    name.setAttribute('font-weight', '600');
    name.setAttribute('fill', '#1a1a1a');
    name.textContent = restaurant.name;
    wrapper.appendChild(name);

    const url = document.createElementNS(ns, 'text');
    url.setAttribute('x', String(totalW / 2));
    url.setAttribute('y', String(totalH - labelH / 2 + 16));
    url.setAttribute('text-anchor', 'middle');
    url.setAttribute('font-family', 'sans-serif');
    url.setAttribute('font-size', '11');
    url.setAttribute('fill', '#888888');
    url.textContent = menuUrl;
    wrapper.appendChild(url);

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(wrapper);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${restaurant.slug}-qr.svg`;
    a.click();
    URL.revokeObjectURL(blobUrl);
    toast('QR kod indirildi.', 'success');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(menuUrl);
    toast('URL kopyalandı.', 'info');
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-snow font-semibold">QR Kodunuz</h1>
        <p className="font-body text-silver text-sm mt-1">
          Masalariniza yerlestirin, musteriler okutarak menunuze ulassin.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center gap-8">
        <div ref={svgRef} className="p-6 bg-white rounded-xl">
          <QRCodeSVG
            value={menuUrl}
            size={220}
            bgColor="#ffffff"
            fgColor="#1a1a1a"
            level="M"
          />
        </div>

        <div className="w-full">
          <p className="font-body text-xs text-silver uppercase tracking-widest mb-2">Menu URL</p>
          <div className="bg-elevated border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-3">
            <p className="font-body text-snow text-sm truncate">{menuUrl}</p>
            <button
              onClick={copyUrl}
              className="font-body text-xs text-gold hover:text-gold-dim flex-shrink-0 transition-colors"
            >
              Kopyala
            </button>
          </div>
        </div>

        <div className="w-full flex gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="flex-1 py-3 border border-border text-silver hover:text-snow hover:border-silver font-body text-sm rounded-lg transition-colors"
          >
            Onizle
          </button>
          <button
            onClick={downloadSvg}
            className="flex-1 py-3 bg-gold hover:bg-gold-dim text-void font-display font-semibold rounded-lg transition-colors"
          >
            SVG Indir
          </button>
        </div>
      </div>

      {/* Social share URL */}
      <div className="mt-4 bg-surface border border-border rounded-2xl p-6">
        <p className="font-body text-xs text-silver uppercase tracking-widest mb-3">Sosyal Medya Paylaşım Linki</p>
        <p className="font-body text-xs text-silver/60 mb-3 leading-relaxed">
          Bu linki WhatsApp, Telegram veya sosyal medyada paylaşın — önizleme olarak restoran adı ve görseli çıkar.
        </p>
        <div className="bg-elevated border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-3">
          <p className="font-body text-silver text-xs truncate">{shareUrl}</p>
          <button
            onClick={() => { navigator.clipboard.writeText(shareUrl); toast('Link kopyalandı.', 'info'); }}
            className="font-body text-xs text-gold hover:text-gold-dim flex-shrink-0 transition-colors"
          >
            Kopyala
          </button>
        </div>
      </div>

      {/* Menu preview modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col"
            style={{ width: 'min(420px, 100%)', height: 'min(750px, 90vh)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
              <p className="font-body text-silver text-sm truncate">{menuUrl}</p>
              <button
                onClick={() => setShowPreview(false)}
                className="font-body text-silver hover:text-snow text-xs ml-4 flex-shrink-0"
              >
                Kapat
              </button>
            </div>
            <iframe
              src={menuUrl}
              title="Menu onizleme"
              className="flex-1 border-none"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
