import { del, get, post } from './http';

const BASE = '/api/students';

export const studentApi = {
  list: (query = '') => get(query ? `${BASE}?q=${encodeURIComponent(query)}` : BASE),
  get: (id) => get(`${BASE}/${encodeURIComponent(id)}`),
  create: (student) => post(BASE, student),
  remove: (id) => del(`${BASE}/${encodeURIComponent(id)}`),
};
