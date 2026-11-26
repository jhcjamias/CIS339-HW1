import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { studentApi } from '@/api/students';
import { useNotificationStore } from './notifications';

// Shared student state used by the search form, add form, list, and details panel.
export const useStudentStore = defineStore('students', () => {
  const notifications = useNotificationStore();

  const students = ref([]); // students currently displayed (all, or search results)
  const query = ref(''); // active search term; '' means "show all"
  const loading = ref(false);
  const loaded = ref(false);
  const loadError = ref('');
  const adding = ref(false);
  const deletingId = ref(null);
  const selectedId = ref(null);

  const isSearching = computed(() => query.value !== '');
  const count = computed(() => students.value.length);
  const selectedStudent = computed(
    () => students.value.find((s) => s.id === selectedId.value) ?? null,
  );

  async function fetchStudents(term = query.value) {
    loading.value = true;
    loadError.value = '';
    query.value = term.trim();
    try {
      students.value = await studentApi.list(query.value);
      loaded.value = true;
      // Keep the details panel only if the selected student is still listed.
      if (!students.value.some((s) => s.id === selectedId.value)) {
        selectedId.value = null;
      }
      // Auto-open details when a search matches exactly one student.
      if (isSearching.value && students.value.length === 1) {
        selectedId.value = students.value[0].id;
      }
    } catch (err) {
      students.value = [];
      loadError.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  const search = (term) => fetchStudents(term);
  const showAll = () => fetchStudents('');

  // Returns { ok: true } or { ok: false, fields } so the form can show
  // server-side validation errors (e.g. a duplicate student ID) inline.
  async function addStudent(student) {
    adding.value = true;
    try {
      const data = await studentApi.create(student);
      notifications.success(data?.message ?? `Student ${student.name} added.`);
      await fetchStudents();
      if (students.value.some((s) => s.id === data.student.id)) {
        selectedId.value = data.student.id;
      }
      return { ok: true };
    } catch (err) {
      notifications.error(err.message);
      return { ok: false, fields: err.fields ?? {} };
    } finally {
      adding.value = false;
    }
  }

  async function deleteStudent(id) {
    deletingId.value = id;
    try {
      const data = await studentApi.remove(id);
      notifications.success(data?.message ?? 'Student deleted.');
      return true;
    } catch (err) {
      notifications.error(err.status === 404 ? 'Student not found or already deleted.' : err.message);
      return err.status === 404; // treat "already gone" as removed from the list
    } finally {
      deletingId.value = null;
    }
  }

  async function removeStudent(id) {
    const removed = await deleteStudent(id);
    if (removed) {
      students.value = students.value.filter((s) => s.id !== id);
      if (selectedId.value === id) selectedId.value = null;
    }
    return removed;
  }

  function select(id) {
    selectedId.value = id;
  }

  return {
    students,
    query,
    loading,
    loaded,
    loadError,
    adding,
    deletingId,
    selectedId,
    isSearching,
    count,
    selectedStudent,
    fetchStudents,
    search,
    showAll,
    addStudent,
    removeStudent,
    select,
  };
});
