import * as Sentry from '@sentry/react';
import { Component, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import { TooltipProvider } from './components/Tooltip';
import { AuthProvider, useAuth } from './context/AuthContext';
import AccountPage from './pages/AccountPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import CategoriesPage from './pages/CategoriesPage';
import DashboardPage from './pages/DashboardPage';
import DesignPage from './pages/DesignPage';
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import QrCodePage from './pages/QrCodePage';
import RegisterPage from './pages/RegisterPage';
import RestaurantInfoPage from './pages/RestaurantInfoPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { restaurant, loading } = useAuth();
  if (loading) return null;
  if (!restaurant) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { restaurant, loading } = useAuth();
  if (loading) return null;
  if (restaurant) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e2e8f0',
              fontFamily: 'inherit',
              fontSize: '14px',
              borderRadius: '12px',
            },
          }}
          richColors
          closeButton
        />
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/qr-code" element={<QrCodePage />} />
            <Route path="/design" element={<DesignPage />} />
            <Route path="/restaurant-info" element={<RestaurantInfoPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <p className="font-display text-4xl text-gold font-semibold">404</p>
      <p className="font-body text-silver text-sm">Bu sayfa bulunamadı.</p>
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
          <p className="font-display text-2xl text-gold font-semibold">Bir hata oluştu</p>
          <p className="font-body text-silver text-sm text-center max-w-sm">
            Sayfa yüklenirken beklenmedik bir hata meydana geldi. Lütfen sayfayı yenileyin.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gold text-void rounded-lg font-body font-semibold text-sm hover:bg-gold-dim transition-colors"
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
