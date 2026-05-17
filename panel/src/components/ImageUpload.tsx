import { useRef, useState } from 'react';
import { uploadImage } from '../api';
import CropModal from './CropModal';

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
};

export default function ImageUpload({ value, onChange, label = 'Fotograf' }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doUpload = async (fileOrBlob: File | Blob) => {
    setError('');
    setUploading(true);
    try {
      const file = fileOrBlob instanceof File ? fileOrBlob : new File([fileOrBlob], 'crop.jpg', { type: 'image/jpeg' });
      const url = await uploadImage(file);
      onChange(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (file: File) => {
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setCropSrc(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCrop = (blob: Blob) => {
    setCropSrc(null);
    setPendingFile(null);
    doUpload(blob);
  };

  const handleUploadDirect = () => {
    setCropSrc(null);
    if (pendingFile) doUpload(pendingFile);
    setPendingFile(null);
  };

  const handleCancel = () => {
    setCropSrc(null);
    setPendingFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-xs text-silver uppercase tracking-widest">{label}</label>

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... veya dosya yukle"
          className="flex-1 bg-elevated border border-border rounded-lg px-4 py-2.5 font-body text-snow text-sm focus:border-gold/50 transition-colors placeholder-silver/40"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2.5 bg-elevated border border-border hover:border-gold/40 text-silver hover:text-snow text-xs font-body rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {uploading ? 'Yukleniyor...' : 'Dosya Sec'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* Preview */}
      {value && (
        <div className="relative w-fit mt-1">
          <img
            src={value}
            alt=""
            className="h-24 w-24 object-cover rounded-xl border border-border"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-900 border border-red-700 rounded-full flex items-center justify-center text-red-300 hover:bg-red-800 transition-colors"
            title="Resmi kaldir"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
              <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          {!uploading && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-6 h-6 bg-elevated border border-border rounded-full flex items-center justify-center text-silver hover:text-snow hover:border-gold/40 transition-colors"
              title="Resmi degistir"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {error && <p className="font-body text-red-400 text-xs">{error}</p>}

      {cropSrc && (
        <CropModal
          src={cropSrc}
          onCrop={handleCrop}
          onUploadDirect={handleUploadDirect}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
