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
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#f5ede0]">
      <p className="text-5xl font-bold text-[#1a3535]/20">404</p>
      <p className="text-lg font-semibold text-[#1a3535]">Sayfa bulunamadı</p>
      <p className="text-sm text-[#1a3535]/60">Aradığınız menü mevcut değil.</p>
    </div>
  );
}
