import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MenuPage from './pages/MenuPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:slug" element={<MenuPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="font-body text-muted text-lg">Sayfa bulunamadı.</p>
    </div>
  );
}
