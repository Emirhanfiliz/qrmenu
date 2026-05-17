const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export type MenuData = {
  id: string;
  name: string;
  logoUrl: string | null;
  theme: string;
  tagline: string | null;
  coverUrl: string | null;
  address: string | null;
  phone: string | null;
  workingHours: string | null;
  wifiInfo: string | null;
  showWelcome: boolean;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  googleMapsUrl: string | null;
  googlePlaceId: string | null;
  categories: {
    id: string;
    name: string;
    imageUrl: string | null;
    products: {
      id: string;
      name: string;
      description: string | null;
      price: string;
      discountedPrice: string | null;
      preparationTime: number | null;
      calories: number | null;
      allergens: string | null;
      imageUrl: string | null;
    }[];
  }[];
  announcements: { id: string; title: string; body: string; imageUrl: string | null }[];
};

export type MenuError = 'NOT_FOUND' | 'SUBSCRIPTION_EXPIRED' | 'UNKNOWN';

export async function getMenu(slug: string): Promise<{ data: MenuData } | { error: MenuError }> {
  const res = await fetch(`${BASE}/menu/${slug}`);
  if (res.ok) return { data: await res.json() };
  if (res.status === 402) return { error: 'SUBSCRIPTION_EXPIRED' };
  if (res.status === 404) return { error: 'NOT_FOUND' };
  return { error: 'UNKNOWN' };
}

export async function recordScan(slug: string) {
  const key = `scanned_${slug}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  await fetch(`${BASE}/menu/${slug}/scan`, { method: 'POST' }).catch(() => {});
}
