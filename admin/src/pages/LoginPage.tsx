import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      navigate('/restaurants');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="font-mono text-emerge text-xs tracking-widest uppercase mb-1">qrmenu</p>
          <h1 className="font-mono text-bright text-2xl">admin_panel</h1>
        </div>

        <form onSubmit={submit} className="bg-surface border border-border rounded-xl p-7 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-dim uppercase">email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-ink border border-border rounded-lg px-4 py-3 font-mono text-bright text-sm focus:border-emerge/40 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-dim uppercase">password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="bg-ink border border-border rounded-lg px-4 py-3 font-mono text-bright text-sm focus:border-emerge/40 transition-colors"
            />
          </div>
          {error && <p className="font-mono text-danger text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerge hover:bg-emerald-600 text-ink font-mono font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'logging in...' : '> login'}
          </button>
        </form>
      </div>
    </div>
  );
}
