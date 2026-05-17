import { useState } from 'react';
import { api } from '../api';

export default function AccountPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.newPassword !== form.confirm) {
      setError('Yeni sifreler eslesmiyorÀ.');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('Yeni sifre en az 6 karakter olmali.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/restaurant/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess('Sifre basariyla guncellendi.');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-elevated border border-border rounded-lg px-4 py-2.5 font-body text-snow text-sm focus:outline-none focus:border-gold/50 transition-colors';

  return (
    <div className="max-w-md">
      <div className="mb-8">
        <h1 className="font-display text-2xl text-snow font-semibold">Hesap</h1>
        <p className="font-body text-silver text-sm mt-1">Sifrenizi buradan degistirebilirsiniz.</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="font-body text-xs text-silver uppercase tracking-widest block mb-1.5">Mevcut Sifre</label>
            <input
              type="password"
              required
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="font-body text-xs text-silver uppercase tracking-widest block mb-1.5">Yeni Sifre</label>
            <input
              type="password"
              required
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="font-body text-xs text-silver uppercase tracking-widest block mb-1.5">Yeni Sifre (Tekrar)</label>
            <input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className={inputCls}
            />
          </div>
          {error && <p className="font-body text-red-400 text-sm">{error}</p>}
          {success && <p className="font-body text-emerald-400 text-sm">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="py-3 bg-gold hover:bg-gold-dim disabled:opacity-50 text-void font-display font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Guncelleniyor...' : 'Sifreyi Guncelle'}
          </button>
        </form>
      </div>
    </div>
  );
}
