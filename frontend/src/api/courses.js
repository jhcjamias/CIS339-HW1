import { del, get, post } from './http';

const BASE = '/api/courses';

export const courseApi = {
  list: () => get(BASE),
  get: (courseId) => get(`${BASE}/${encodeURIComponent(courseId)}`),
  create: (course) => post(BASE, course),
  remove: (courseId) => del(`${BASE}/${encodeURIComponent(courseId)}`),
};
