import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

type Restaurant = {
  id: string;
  name: string;
  email: string;
  slug: string;
  logoUrl: string | null;
  status: string;
  emailVerifiedAt: string | null;
  subscription: { type: string; endsAt: string } | null;
};

type AuthCtx = {
  restaurant: Restaurant | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await api.get('/restaurant/me');
      setRestaurant(data);
    } catch {
      setRestaurant(null);
      localStorage.removeItem('token');
    }
  };

  useEffect(() => {
    if (localStorage.getItem('token')) {
      refresh().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setRestaurant(data.restaurant);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setRestaurant(null);
  };

  return (
    <Ctx.Provider value={{ restaurant, loading, login, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
