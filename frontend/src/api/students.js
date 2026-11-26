import { post } from './http';

export const studentApi = {
  find: (name) => post('/find-student', { name }),
  add: (student) => post('/add-student', student),
  remove: (name) => post('/delete-student', { name }),
};
