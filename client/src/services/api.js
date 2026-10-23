const API_URL = '/api';

export async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: options.body instanceof FormData ? options.headers : { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json().catch(() => ({ success: false, message: 'The server returned an invalid response.' }));
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
}

export function imageUrl(filename) {
  return filename ? `/uploads/${filename}` : null;
}
