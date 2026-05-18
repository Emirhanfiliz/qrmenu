import { useState } from 'react';
import { Link, Outlet, useNavigate, useMatch } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MENU_BASE = import.meta.env.VITE_MENU_BASE || 'http://localhost:5173';

const NAV_GROUPS = [
  {
    label: 'MENÜ',
    items: [
      { to: '/dashboard',     label: 'Dashboard',    d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 21V12h6v9' },
      { to: '/categories',    label: 'Kategoriler',  d: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
      { to: '/products',      label: 'Ürünler',      d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
      { to: '/announcements', label: 'Duyurular',    d: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
    ],
  },
  {
    label: 'AYARLAR',
    items: [
      { to: '/design',   label: 'Tasarım Ayarları', d: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { to: '/qr-code',  label: 'QR Kod',           d: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
    ],
  },
  {
    label: 'BİLGİ',
    items: [
      { to: '/restaurant-info', label: 'Restoran Bilgileri', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { to: '/account',         label: 'Hesap',             d: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    ],
  },
];

function NavItem({ item, collapsed }: { item: { to: string; label: string; d: string }; collapsed: boolean }) {
  const match = useMatch(item.to);
  const active = !!match;

  return (
    <Link
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm transition-all duration-150 ${
        collapsed ? 'justify-center' : ''
      } ${
        active
          ? 'bg-gold/10 text-gold font-semibold'
          : 'text-silver hover:bg-elevated hover:text-snow'
      }`}
    >
      <svg
        className="w-[19px] h-[19px] flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={item.d} />
      </svg>
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export default function Layout() {
  const { restaurant, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const menuUrl = restaurant?.slug ? `${MENU_BASE}/${restaurant.slug}` : null;

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <div className={`flex items-center border-b border-border px-4 h-14 flex-shrink-0 ${collapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
        {(!collapsed || isMobile) && (
          <span className="font-body text-xs font-semibold text-silver tracking-widest uppercase">Menü</span>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-lg hover:bg-elevated flex items-center justify-center text-silver hover:text-snow transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-3' : ''}>
            {/* Group label */}
            {(!collapsed || isMobile) && (
              <p className="px-3 mb-1.5 font-body text-[10px] font-semibold text-silver/50 tracking-widest uppercase">
                {group.label}
              </p>
            )}
            {collapsed && !isMobile && gi > 0 && (
              <div className="h-px bg-border mx-2 mb-3" />
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  collapsed={collapsed && !isMobile}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="h-screen bg-void flex flex-col overflow-hidden">

      {/* ── Top Navbar ── */}
      <header className="h-14 bg-surface border-b border-border flex items-center px-5 gap-4 flex-shrink-0 z-30">

        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-display font-bold text-snow text-sm tracking-tight">qrmenu</span>
        </div>

        <div className="flex-1" />

        {/* Restaurant greeting */}
        <p className="hidden sm:block font-body text-sm text-silver">
          Hoş geldiniz,{' '}
          <span className="font-semibold text-snow">{restaurant?.name}</span>
        </p>

        <div className="hidden sm:block h-5 w-px bg-border" />

        {/* Menu preview link */}
        {menuUrl && (
          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 font-body text-sm text-gold hover:text-gold-dim transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Menüyü Test Et
          </a>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 font-body text-sm text-silver hover:text-snow transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Çıkış Yap</span>
        </button>

        {/* Mobile burger */}
        <button
          className="sm:hidden w-8 h-8 flex flex-col items-center justify-center gap-[5px]"
          onClick={() => setMobileOpen(true)}
        >
          <span className="block h-px bg-snow w-5" />
          <span className="block h-px bg-snow w-3.5" />
          <span className="block h-px bg-snow w-5" />
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop Sidebar */}
        <aside
          className={`hidden sm:flex flex-col bg-surface border-r border-border flex-shrink-0 transition-all duration-200 ${
            collapsed ? 'w-[60px]' : 'w-56'
          }`}
        >
          {sidebarContent(false)}
        </aside>

        {/* Mobile overlay + sidebar */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 z-20 bg-black/40" onClick={() => setMobileOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-30 w-56 bg-surface border-r border-border flex flex-col">
              {sidebarContent(true)}
            </aside>
          </>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-7 lg:px-10 lg:py-8 max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
