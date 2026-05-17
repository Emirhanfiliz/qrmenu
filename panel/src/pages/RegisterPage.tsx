import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-5">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10l5 5 7-8" stroke="#f0a500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-display text-snow text-xl font-medium">Kaydiniz alindi</p>
          <p className="font-body text-silver text-sm mt-2 leading-relaxed">
            Hesabiniz admin onayina gonderildi. Onaylanan hesabinizi kullanmaya baslamak icin giris yapin.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 px-6 py-2.5 bg-gold text-void font-display font-semibold rounded-lg hover:bg-gold-dim transition-colors text-sm"
          >
            Giris Sayfasina Don
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-display text-gold text-3xl font-semibold">qrmenu</p>
          <p className="font-body text-silver text-sm mt-2">Yeni restoran hesabi olusturun</p>
        </div>

        <form onSubmit={submit} className="bg-surface border border-border rounded-2xl p-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs text-silver uppercase tracking-widest">Restoran Adi</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors"
              placeholder="Lezzet Duraği"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs text-silver uppercase tracking-widest">E-posta</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors"
              placeholder="restoran@ornek.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs text-silver uppercase tracking-widest">Sifre</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors"
              placeholder="En az 6 karakter"
            />
          </div>

          {error && (
            <p className="font-body text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-dim text-void font-display font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 mt-1"
          >
            {loading ? 'Kaydediliyor...' : 'Kayit Ol'}
          </button>

          <p className="font-body text-silver text-sm text-center">
            Zaten hesabiniz var mi?{' '}
            <Link to="/login" className="text-gold hover:underline">
              Giris yapin
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
