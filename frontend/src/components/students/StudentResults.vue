<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import BaseCard from '@/components/BaseCard.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import StudentTable from './StudentTable.vue';
import { useStudentStore } from '@/stores/students';

const store = useStudentStore();
const { results, searching, searchError, hasSearched, hasResults, deletingName } = storeToRefs(store);

const pendingDelete = ref(null);

function requestDelete(student) {
  pendingDelete.value = student;
}

async function confirmDelete() {
  if (!pendingDelete.value) return;
  await store.deleteStudent(pendingDelete.value.name);
  pendingDelete.value = null;
}
</script>

<template>
  <BaseCard title="Results" heading-id="results-heading">
    <div aria-live="polite">
      <LoadingSpinner v-if="searching" label="Searching for student…" />
      <EmptyState v-else-if="searchError" :message="searchError" tone="warning" />
      <StudentTable
        v-else-if="hasResults"
        :students="results"
        :deleting-name="deletingName"
        @delete="requestDelete"
      />
      <EmptyState
        v-else-if="hasSearched"
        message="No student matches your search."
      />
      <EmptyState v-else message="Search for a student by name to see their information here." />
    </div>
  </BaseCard>

  <ConfirmDialog
    :open="pendingDelete !== null"
    title="Delete student"
    :message="pendingDelete ? `Delete student ${pendingDelete.name} (ID ${pendingDelete.id})? This cannot be undone.` : ''"
    confirm-label="Delete"
    :busy="deletingName !== null"
    @confirm="confirmDelete"
    @cancel="pendingDelete = null"
  />
</template>
