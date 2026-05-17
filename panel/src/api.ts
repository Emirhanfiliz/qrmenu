import { toast } from './lib/toast';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function token() {
  return localStorage.getItem('token');
}

// Paths that should not trigger automatic toasts
const SILENT_PATTERNS = ['/auth/', '/upload', 'reorder', 'change-password', '/restaurant/design', 'places-search'];
const isSilent = (path: string) => SILENT_PATTERNS.some(p => path.includes(p));

const SUCCESS_MSG: Record<string, string> = {
  POST: 'Eklendi.',
  PATCH: 'Güncellendi.',
  DELETE: 'Silindi.',
};

async function req(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message[0] : (data.message || 'Bir hata oluştu.');
    if (!isSilent(path)) toast(msg, 'error');
    throw new Error(msg);
  }
  if (method !== 'GET' && !isSilent(path) && SUCCESS_MSG[method]) {
    toast(SUCCESS_MSG[method]);
  }
  return data;
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    headers: token() ? { Authorization: `Bearer ${token()}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload başarısız.');
  return data.url as string;
}

export const api = {
  get: (path: string) => req('GET', path),
  post: (path: string, body: unknown) => req('POST', path, body),
  patch: (path: string, body: unknown) => req('PATCH', path, body),
  delete: (path: string) => req('DELETE', path),
};
