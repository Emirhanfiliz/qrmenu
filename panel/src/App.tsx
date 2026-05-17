import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AccountPage from './pages/AccountPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import CategoriesPage from './pages/CategoriesPage';
import DashboardPage from './pages/DashboardPage';
import DesignPage from './pages/DesignPage';
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import QrCodePage from './pages/QrCodePage';
import RegisterPage from './pages/RegisterPage';

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
    <ToastProvider>
    <AuthProvider>
      <BrowserRouter>
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
            <Route path="/account" element={<AccountPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ToastProvider>
  );
}
