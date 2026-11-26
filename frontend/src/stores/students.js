import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { studentApi } from '@/api/students';
import { useNotificationStore } from './notifications';

// Shared student state used by the search form, add form, and results table.
export const useStudentStore = defineStore('students', () => {
  const notifications = useNotificationStore();

  const results = ref([]);
  const lastQuery = ref('');
  const searching = ref(false);
  const adding = ref(false);
  const deletingName = ref(null);
  const searchError = ref('');

  const hasSearched = computed(() => lastQuery.value !== '');
  const hasResults = computed(() => results.value.length > 0);

  async function searchStudent(name) {
    const query = name.trim();
    searching.value = true;
    searchError.value = '';
    lastQuery.value = query;
    try {
      const student = await studentApi.find(query);
      results.value = student ? [student] : [];
    } catch (err) {
      results.value = [];
      if (err.status === 404) {
        searchError.value = `No student named "${query}" was found.`;
      } else {
        searchError.value = err.message;
        notifications.error(err.message);
      }
    } finally {
      searching.value = false;
    }
  }

  async function addStudent(student) {
    adding.value = true;
    try {
      const data = await studentApi.add(student);
      notifications.success(data?.message ?? `Student ${student.name} added.`);
      return true;
    } catch (err) {
      notifications.error(err.message);
      return false;
    } finally {
      adding.value = false;
    }
  }

  async function deleteStudent(name) {
    deletingName.value = name;
    try {
      const data = await studentApi.remove(name);
      results.value = results.value.filter((s) => s.name !== name);
      notifications.success(data?.message ?? `Student ${name} deleted.`);
      return true;
    } catch (err) {
      if (err.status === 404) {
        results.value = results.value.filter((s) => s.name !== name);
        notifications.error('Student not found or already deleted.');
      } else {
        notifications.error(err.message);
      }
      return false;
    } finally {
      deletingName.value = null;
    }
  }

  function clearResults() {
    results.value = [];
    lastQuery.value = '';
    searchError.value = '';
  }

  return {
    results,
    lastQuery,
    searching,
    adding,
    deletingName,
    searchError,
    hasSearched,
    hasResults,
    searchStudent,
    addStudent,
    deleteStudent,
    clearResults,
  };
});
