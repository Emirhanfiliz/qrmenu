import { useRef, useState } from 'react';

interface Props {
  src: string;
  onCrop: (blob: Blob) => void;
  onUploadDirect: () => void;
  onCancel: () => void;
}

interface Sel { x: number; y: number; w: number; h: number }

export default function CropModal({ src, onCrop, onUploadDirect, onCancel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [sel, setSel] = useState<Sel | null>(null);
  const dragging = useRef(false);
  const origin = useRef({ x: 0, y: 0 });

  const toRelative = (e: React.MouseEvent) => {
    const r = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - r.left, r.width)),
      y: Math.max(0, Math.min(e.clientY - r.top, r.height)),
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging.current = true;
    const pt = toRelative(e);
    origin.current = pt;
    setSel({ x: pt.x, y: pt.y, w: 0, h: 0 });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const pt = toRelative(e);
    setSel({
      x: Math.min(origin.current.x, pt.x),
      y: Math.min(origin.current.y, pt.y),
      w: Math.abs(pt.x - origin.current.x),
      h: Math.abs(pt.y - origin.current.y),
    });
  };

  const onMouseUp = () => { dragging.current = false; };

  const applyCrop = () => {
    const img = imgRef.current;
    if (!img || !sel || sel.w < 5 || sel.h < 5) return;
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sel.w * scaleX);
    canvas.height = Math.round(sel.h * scaleY);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, sel.x * scaleX, sel.y * scaleY, sel.w * scaleX, sel.h * scaleY, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => { if (blob) onCrop(blob); }, 'image/jpeg', 0.92);
  };

  const hasSelection = sel && sel.w > 5 && sel.h > 5;

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-lg flex flex-col gap-4">
        <div>
          <h3 className="font-display text-snow text-lg font-semibold">Resmi Kirp</h3>
          <p className="font-body text-silver text-xs mt-1">
            Kirpmak istediginiz alani tiklatip suruklayerek secin.
          </p>
        </div>

        <div className="flex justify-center">
          <div
            ref={containerRef}
            className="relative cursor-crosshair rounded-lg overflow-hidden select-none"
            style={{ display: 'inline-block', maxWidth: '100%' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <img
              ref={imgRef}
              src={src}
              alt=""
              style={{ display: 'block', maxWidth: '460px', maxHeight: '340px', width: 'auto', height: 'auto' }}
              draggable={false}
            />
            {sel && sel.w > 2 && sel.h > 2 && (
              <>
                <div className="absolute inset-0 bg-black/45 pointer-events-none" />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: sel.x,
                    top: sel.y,
                    width: sel.w,
                    height: sel.h,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0)',
                    border: '2px solid rgba(255,255,255,0.9)',
                    background: 'transparent',
                  }}
                />
                {/* Corners */}
                {([[0,0],[1,0],[0,1],[1,1]] as [number,number][]).map(([cx,cy]) => (
                  <div
                    key={`${cx}${cy}`}
                    className="absolute w-3 h-3 bg-white rounded-sm pointer-events-none"
                    style={{
                      left: sel.x + cx * sel.w - 6,
                      top: sel.y + cy * sel.h - 6,
                    }}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 border border-border text-silver font-body text-sm rounded-lg hover:bg-elevated transition-colors"
          >
            Iptal
          </button>
          <button
            type="button"
            onClick={onUploadDirect}
            className="flex-1 py-2.5 border border-border text-silver font-body text-sm rounded-lg hover:bg-elevated transition-colors"
          >
            Kirpmadan Yukle
          </button>
          <button
            type="button"
            onClick={applyCrop}
            disabled={!hasSelection}
            className="flex-1 py-2.5 bg-gold hover:bg-gold-dim text-void font-display font-semibold text-sm rounded-lg disabled:opacity-40 transition-colors"
          >
            Kirp ve Yukle
          </button>
        </div>
      </div>
    </div>
  );
}
