import { get, post } from './http';

export const enrollmentApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(qs ? `/api/enrollments?${qs}` : '/api/enrollments');
  },
  create: (studentId, courseId) => post('/api/enrollments', { studentId, courseId }),
  roster: (courseId) => get(`/api/courses/${encodeURIComponent(courseId)}/students`),
};
