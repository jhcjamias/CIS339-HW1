<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import BaseCard from '@/components/BaseCard.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import StudentDetails from './StudentDetails.vue';
import StudentTable from './StudentTable.vue';
import { useStudentStore } from '@/stores/students';

const store = useStudentStore();
const {
  students,
  query,
  loading,
  loaded,
  loadError,
  isSearching,
  count,
  deletingId,
  selectedId,
  selectedStudent,
} = storeToRefs(store);

const pendingDelete = ref(null);

const listTitle = computed(() =>
  isSearching.value ? `Results for “${query.value}” (${count.value})` : `All Students (${count.value})`,
);

onMounted(() => {
  if (!loaded.value) store.fetchStudents();
});

function requestDelete(student) {
  pendingDelete.value = student;
}

async function confirmDelete() {
  if (!pendingDelete.value) return;
  await store.removeStudent(pendingDelete.value.id);
  pendingDelete.value = null;
}
</script>

<template>
  <div class="grid-results" :class="{ 'has-details': selectedStudent }">
    <BaseCard :title="listTitle" heading-id="results-heading">
      <template v-if="isSearching" #actions>
        <button type="button" class="btn btn-secondary btn-sm" :disabled="loading" @click="store.showAll()">
          Show all
        </button>
      </template>

      <div aria-live="polite">
        <LoadingSpinner v-if="loading" :label="isSearching ? 'Searching for students…' : 'Loading students…'" />
        <EmptyState v-else-if="loadError" :message="loadError" tone="warning">
          <button type="button" class="btn btn-secondary btn-sm retry" @click="store.fetchStudents()">
            Try again
          </button>
        </EmptyState>
        <StudentTable
          v-else-if="students.length"
          :students="students"
          :selected-id="selectedId"
          :deleting-id="deletingId"
          @select="store.select"
          @delete="requestDelete"
        />
        <EmptyState
          v-else-if="isSearching"
          :message="`No students match “${query}”.`"
          tone="warning"
        />
        <EmptyState v-else message="No students yet. Use the form above to add the first one." />
      </div>
    </BaseCard>

    <BaseCard v-if="selectedStudent" title="Student Information" heading-id="details-heading">
      <StudentDetails
        :student="selectedStudent"
        :deleting="deletingId === selectedStudent.id"
        @delete="requestDelete"
        @close="store.select(null)"
      />
    </BaseCard>
  </div>

  <ConfirmDialog
    :open="pendingDelete !== null"
    title="Delete student"
    :message="
      pendingDelete
        ? `Delete student ${pendingDelete.name} (ID ${pendingDelete.id})? All of their course enrollments will also be removed. This cannot be undone.`
        : ''
    "
    confirm-label="Delete"
    :busy="deletingId !== null"
    @confirm="confirmDelete"
    @cancel="pendingDelete = null"
  />
</template>
