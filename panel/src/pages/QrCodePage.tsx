import { useRef } from 'react';
import { QRCodeSVG } from 'react-qr-code';
import { useAuth } from '../context/AuthContext';

const MENU_BASE = 'http://localhost:5173';

export default function QrCodePage() {
  const { restaurant } = useAuth();
  const svgRef = useRef<HTMLDivElement>(null);

  if (!restaurant) return null;

  const menuUrl = `${MENU_BASE}/${restaurant.slug}`;

  const downloadSvg = () => {
    const svgEl = svgRef.current?.querySelector('svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${restaurant.slug}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-md">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-snow font-semibold">QR Kodunuz</h1>
        <p className="font-body text-silver text-sm mt-1">
          Masalariniza yerlestirin, musteriler okutarak menunuze ulassin.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center gap-8">
        {/* QR */}
        <div ref={svgRef} className="p-6 bg-white rounded-xl">
          <QRCodeSVG
            value={menuUrl}
            size={220}
            bgColor="#ffffff"
            fgColor="#1a1a1a"
            level="M"
          />
        </div>

        {/* URL */}
        <div className="w-full">
          <p className="font-body text-xs text-silver uppercase tracking-widest mb-2">Menu URL</p>
          <div className="bg-elevated border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-3">
            <p className="font-body text-snow text-sm truncate">{menuUrl}</p>
            <button
              onClick={() => navigator.clipboard.writeText(menuUrl)}
              className="font-body text-xs text-gold hover:text-gold-dim flex-shrink-0 transition-colors"
            >
              Kopyala
            </button>
          </div>
        </div>

        {/* Download */}
        <button
          onClick={downloadSvg}
          className="w-full py-3 bg-gold hover:bg-gold-dim text-void font-display font-semibold rounded-lg transition-colors"
        >
          SVG Olarak Indir
        </button>
      </div>

      <div className="mt-4 px-5 py-4 bg-surface border border-border rounded-xl">
        <p className="font-body text-xs text-silver leading-relaxed">
          QR kodu menunuze baglidir. Slug: <span className="text-gold font-medium">{restaurant.slug}</span>
        </p>
      </div>
    </div>
  );
}
