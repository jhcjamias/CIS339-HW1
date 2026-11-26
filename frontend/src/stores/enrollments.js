import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { enrollmentApi } from '@/api/enrollments';
import { useNotificationStore } from './notifications';

// Enrollment actions plus the roster for the currently selected course.
// The enroll form and roster panel share this state, so enrolling a student
// updates the roster without the components talking to each other directly.
export const useEnrollmentStore = defineStore('enrollments', () => {
  const notifications = useNotificationStore();

  const enrolling = ref(false);

  const rosterCourseId = ref('');
  const rosterCourse = ref(null);
  const rosterStudents = ref([]);
  const rosterLoading = ref(false);
  const rosterError = ref('');

  const rosterCount = computed(() => rosterStudents.value.length);

  let rosterRequest = 0; // ignore responses from superseded requests

  async function loadRoster(courseId = rosterCourseId.value) {
    rosterCourseId.value = courseId;
    rosterError.value = '';
    if (!courseId) {
      rosterCourse.value = null;
      rosterStudents.value = [];
      return;
    }

    const requestId = ++rosterRequest;
    rosterLoading.value = true;
    try {
      const data = await enrollmentApi.roster(courseId);
      if (requestId !== rosterRequest) return;
      rosterCourse.value = data.course;
      rosterCourseId.value = data.course.courseId; // canonical ID (e.g. from a lowercase URL)
      rosterStudents.value = data.students;
    } catch (err) {
      if (requestId !== rosterRequest) return;
      rosterCourse.value = null;
      rosterStudents.value = [];
      rosterError.value = err.status === 404 ? 'That course no longer exists.' : err.message;
    } finally {
      if (requestId === rosterRequest) rosterLoading.value = false;
    }
  }

  // Returns { ok: true } or { ok: false, fields } for inline form errors.
  async function enroll(studentId, courseId) {
    enrolling.value = true;
    try {
      const data = await enrollmentApi.create(studentId, courseId);
      notifications.success(data?.message ?? 'Student enrolled.');
      // Show the roster of the course the student was just enrolled in.
      await loadRoster(data.enrollment.courseId);
      return { ok: true };
    } catch (err) {
      notifications.error(err.message);
      return { ok: false, fields: err.fields ?? {} };
    } finally {
      enrolling.value = false;
    }
  }

  return {
    enrolling,
    rosterCourseId,
    rosterCourse,
    rosterStudents,
    rosterLoading,
    rosterError,
    rosterCount,
    loadRoster,
    enroll,
  };
});
