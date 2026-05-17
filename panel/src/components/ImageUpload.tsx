import { useRef, useState } from 'react';
import { uploadImage } from '../api';

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
};

export default function ImageUpload({ value, onChange, label = 'Fotograf' }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-xs text-silver uppercase tracking-widest">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... veya yukle"
          className="flex-1 bg-elevated border border-border rounded-lg px-4 py-2.5 font-body text-snow text-sm focus:border-gold/50 transition-colors placeholder-silver/40"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2.5 bg-elevated border border-border hover:border-gold/40 text-silver hover:text-snow text-xs font-body rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {uploading ? 'Yukluyor...' : 'Yukle'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
      </div>
      {value && (
        <img src={value} alt="" className="mt-1 h-16 w-16 object-cover rounded-lg border border-border" />
      )}
      {error && <p className="font-body text-red-400 text-xs">{error}</p>}
    </div>
  );
}
