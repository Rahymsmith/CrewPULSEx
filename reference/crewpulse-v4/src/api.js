const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';
export const getToken = () => localStorage.getItem('cp_token');
export const setToken = (t) => (t ? localStorage.setItem('cp_token', t) : localStorage.removeItem('cp_token'));
export async function api(path, body) {
  const r = await fetch(BASE + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', ...(getToken() ? { authorization: 'Bearer ' + getToken() } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Request failed');
  return j;
}
