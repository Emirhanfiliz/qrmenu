const BASE = 'http://localhost:3001';

function token() {
  return localStorage.getItem('admin_token');
}

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
  if (!res.ok) throw new Error(data.message || 'Bir hata oluştu.');
  return data;
}

export const api = {
  get: (path: string) => req('GET', path),
  post: (path: string, body: unknown) => req('POST', path, body),
  patch: (path: string, body: unknown) => req('PATCH', path, body),
};
