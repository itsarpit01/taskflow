const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('tf_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  // Read as text first so an empty response (backend down) doesn't crash JSON parsing
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

  if (!res.ok) {
    const msg =
      data.error ||
      data.errors?.[0]?.msg ||
      (res.status >= 500 ? 'Server error. Is the backend running?' : 'Request failed');
    throw new Error(msg);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};