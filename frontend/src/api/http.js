// Small wrapper around fetch for talking to the Express backend.
// Requests use relative URLs: in development Vite proxies them to
// http://localhost:3000, and in production Express serves the app itself.

export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields; // per-field validation messages from the server
  }
}

export async function request(url, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Unable to reach the server. Make sure the backend is running.', 0);
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed (HTTP ${response.status}).`;
    throw new ApiError(message, response.status, data?.fields ?? {});
  }

  return data;
}

export const get = (url) => request(url);
export const post = (url, body) => request(url, { method: 'POST', body });
export const del = (url) => request(url, { method: 'DELETE' });
