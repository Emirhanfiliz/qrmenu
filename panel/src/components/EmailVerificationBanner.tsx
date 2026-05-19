import { useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function EmailVerificationBanner() {
  const { restaurant, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  if (!restaurant || restaurant.emailVerifiedAt) return null;

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[i] = val.slice(-1);
    setCode(next);
    setError('');
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setCode(text.split(''));
      inputs.current[5]?.focus();
    }
  };

  const submit = async () => {
    const token = code.join('');
    if (token.length < 6) { setError('6 haneli kodu girin.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-email', { token });
      await refresh();
      setOpen(false);
    } catch (e: any) {
      setError(e.message || 'Hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setResendMsg('');
    try {
      await api.post('/auth/resend-verification', {});
      setResendMsg('Kod gönderildi.');
    } catch (e: any) {
      setResendMsg(e.message || 'Hata oluştu.');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="font-body text-sm text-amber-300">
            Email adresiniz doğrulanmamış —{' '}
            <span className="font-semibold">{restaurant.email}</span>
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="font-body text-xs font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/10 px-3 py-1 rounded-lg transition-colors flex-shrink-0"
        >
          Kodu Gir
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-display text-snow font-bold text-lg mb-1">Email Doğrulama</h2>
            <p className="font-body text-silver text-sm mb-6">
              <span className="text-snow font-semibold">{restaurant.email}</span> adresine gönderilen 6 haneli kodu girin.
            </p>

            <div className="flex gap-2 justify-center mb-5" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  maxLength={1}
                  className="w-11 h-13 text-center text-xl font-bold font-display text-snow bg-elevated border border-border rounded-xl focus:outline-none focus:border-gold transition-colors"
                />
              ))}
            </div>

            {error && <p className="font-body text-xs text-red-400 text-center mb-3">{error}</p>}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-2.5 bg-gold text-void font-display font-bold rounded-xl hover:bg-gold-dim transition-colors disabled:opacity-50"
            >
              {loading ? 'Doğrulanıyor...' : 'Doğrula'}
            </button>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={resend}
                disabled={resending}
                className="font-body text-xs text-silver hover:text-snow transition-colors disabled:opacity-50"
              >
                {resending ? 'Gönderiliyor...' : 'Tekrar gönder'}
              </button>
              {resendMsg && <p className="font-body text-xs text-emerald-400">{resendMsg}</p>}
              <button
                onClick={() => { setOpen(false); setCode(['', '', '', '', '', '']); setError(''); }}
                className="font-body text-xs text-silver hover:text-snow transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
