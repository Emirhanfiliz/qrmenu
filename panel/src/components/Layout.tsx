import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/categories', label: 'Kategoriler' },
  { to: '/products', label: 'Urunler' },
  { to: '/announcements', label: 'Duyurular' },
  { to: '/qr-code', label: 'QR Kod' },
];

export default function Layout() {
  const { restaurant, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-void flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 bg-surface border-r border-border flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-6 py-7 border-b border-border">
          <p className="font-display text-gold text-xl font-semibold tracking-tight">qrmenu</p>
          <p className="font-body text-silver text-xs mt-1 truncate">{restaurant?.name}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-lg font-body text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-gold/10 text-gold font-medium'
                    : 'text-silver hover:bg-elevated hover:text-snow'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Subscription badge */}
        {restaurant?.subscription && (
          <div className="mx-3 mb-3 px-4 py-3 rounded-lg bg-elevated border border-border">
            <p className="font-body text-xs text-silver">Abonelik</p>
            <p className="font-display text-gold text-sm font-medium mt-0.5">
              {restaurant.subscription.type === 'TRIAL' ? 'Deneme' : 'Yillik'}
            </p>
            <p className="font-body text-xs text-silver/60 mt-1">
              {new Date(restaurant.subscription.endsAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        )}

        {/* Logout */}
        <div className="px-3 pb-5">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 rounded-lg font-body text-sm text-silver hover:bg-elevated hover:text-snow transition-all duration-150 text-left"
          >
            Cikis Yap
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden h-14 bg-surface border-b border-border flex items-center px-4 gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8 flex flex-col justify-center gap-1.5"
          >
            <span className="block h-px bg-snow w-5" />
            <span className="block h-px bg-snow w-4" />
            <span className="block h-px bg-snow w-5" />
          </button>
          <p className="font-display text-gold font-semibold">qrmenu</p>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
