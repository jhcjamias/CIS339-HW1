import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { courseApi } from '@/api/courses';
import { useNotificationStore } from './notifications';

// Shared course state. Used by the Courses view now and by the
// enrollment views later (course selection lists).
export const useCourseStore = defineStore('courses', () => {
  const notifications = useNotificationStore();

  const courses = ref([]);
  const loading = ref(false);
  const loaded = ref(false);
  const loadError = ref('');
  const adding = ref(false);
  const deletingId = ref(null);
  const filter = ref('');

  const count = computed(() => courses.value.length);
  const filteredCourses = computed(() => {
    const term = filter.value.trim().toLowerCase();
    if (!term) return courses.value;
    return courses.value.filter(
      (c) => c.courseId.toLowerCase().includes(term) || c.courseName.toLowerCase().includes(term),
    );
  });

  async function fetchCourses() {
    loading.value = true;
    loadError.value = '';
    try {
      courses.value = await courseApi.list();
      loaded.value = true;
    } catch (err) {
      loadError.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  // Returns { ok: true } or { ok: false, fields } for inline form errors.
  async function addCourse(course) {
    adding.value = true;
    try {
      const data = await courseApi.create(course);
      notifications.success(data?.message ?? `Course ${course.courseId} added.`);
      await fetchCourses();
      return { ok: true };
    } catch (err) {
      notifications.error(err.message);
      return { ok: false, fields: err.fields ?? {} };
    } finally {
      adding.value = false;
    }
  }

  async function removeCourse(courseId) {
    deletingId.value = courseId;
    try {
      const data = await courseApi.remove(courseId);
      notifications.success(data?.message ?? `Course ${courseId} deleted.`);
      courses.value = courses.value.filter((c) => c.courseId !== courseId);
      return true;
    } catch (err) {
      if (err.status === 404) {
        courses.value = courses.value.filter((c) => c.courseId !== courseId);
        notifications.error('Course not found or already deleted.');
      } else {
        notifications.error(err.message);
      }
      return false;
    } finally {
      deletingId.value = null;
    }
  }

  return {
    courses,
    loading,
    loaded,
    loadError,
    adding,
    deletingId,
    filter,
    count,
    filteredCourses,
    fetchCourses,
    addCourse,
    removeCourse,
  };
});
