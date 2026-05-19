import { BrowserRouter, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RestaurantsPage from './pages/RestaurantsPage';
import DashboardPage from './pages/DashboardPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import LogsPage from './pages/LogsPage';

function Nav() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `font-mono text-xs transition-colors ${isActive ? 'text-bright' : 'text-dim hover:text-bright'}`;

  return (
    <header className="border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-mono text-emerge text-sm">qrmenu/admin</span>
        <nav className="flex gap-4">
          <NavLink to="/dashboard" className={linkClass}>dashboard</NavLink>
          <NavLink to="/restaurants" className={linkClass}>restaurants</NavLink>
          <NavLink to="/logs" className={linkClass}>logs</NavLink>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <p className="font-mono text-dim text-xs">{admin?.email}</p>
        <button onClick={handleLogout} className="font-mono text-xs text-dim hover:text-bright transition-colors">
          logout
        </button>
      </div>
    </header>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink">
      <Nav />
      {children}
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAuth();
  if (loading) return null;
  if (!admin) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAuth();
  if (loading) return null;
  if (admin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/restaurants" element={<ProtectedRoute><RestaurantsPage /></ProtectedRoute>} />
          <Route path="/restaurants/:id" element={<ProtectedRoute><RestaurantDetailPage /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><LogsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
