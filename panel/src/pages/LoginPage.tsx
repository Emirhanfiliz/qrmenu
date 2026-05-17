import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-display text-gold text-3xl font-semibold">qrmenu</p>
          <p className="font-body text-silver text-sm mt-2">Restoran paneline giris yapin</p>
        </div>

        <form onSubmit={submit} className="bg-surface border border-border rounded-2xl p-8 flex flex-col gap-5">
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
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="bg-elevated border border-border rounded-lg px-4 py-3 font-body text-snow text-sm focus:border-gold/50 transition-colors"
              placeholder="••••••••"
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
            {loading ? 'Giris yapiliyor...' : 'Giris Yap'}
          </button>

          <p className="font-body text-silver text-sm text-center">
            Hesabiniz yok mu?{' '}
            <Link to="/register" className="text-gold hover:underline">
              Kayit olun
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
