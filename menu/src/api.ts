const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export async function getMenu(slug: string) {
  const res = await fetch(`${BASE}/menu/${slug}`);
  if (!res.ok) throw new Error('Menü bulunamadı.');
  return res.json();
}
