<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import BaseCard from '@/components/BaseCard.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import CourseTable from './CourseTable.vue';
import { useCourseStore } from '@/stores/courses';

const store = useCourseStore();
const { loading, loaded, loadError, count, filter, filteredCourses, deletingId } = storeToRefs(store);

const pendingDelete = ref(null);

const title = computed(() => `Courses List (${count.value})`);

onMounted(() => {
  // Always refresh on entering the view so the list reflects the server.
  store.fetchCourses();
});

async function confirmDelete() {
  if (!pendingDelete.value) return;
  await store.removeCourse(pendingDelete.value.courseId);
  pendingDelete.value = null;
}
</script>

<template>
  <BaseCard :title="title" heading-id="course-list-heading">
    <template #actions>
      <button type="button" class="btn btn-secondary btn-sm" :disabled="loading" @click="store.fetchCourses()">
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </template>

    <div v-if="count > 0" class="list-filter">
      <label for="course-filter" class="sr-only">Filter courses</label>
      <input
        id="course-filter"
        v-model="filter"
        type="search"
        placeholder="Filter by course ID or name"
        autocomplete="off"
      />
    </div>

    <div aria-live="polite">
      <LoadingSpinner v-if="loading && !loaded" label="Loading courses…" />
      <EmptyState v-else-if="loadError" :message="loadError" tone="warning">
        <button type="button" class="btn btn-secondary btn-sm retry" @click="store.fetchCourses()">
          Try again
        </button>
      </EmptyState>
      <CourseTable
        v-else-if="filteredCourses.length"
        :courses="filteredCourses"
        :deleting-id="deletingId"
        @delete="pendingDelete = $event"
      />
      <EmptyState v-else-if="count > 0" :message="`No courses match “${filter}”.`" />
      <EmptyState v-else message="No courses yet. Use the form to add the first one." />
    </div>
  </BaseCard>

  <ConfirmDialog
    :open="pendingDelete !== null"
    title="Delete course"
    :message="
      pendingDelete
        ? `Delete ${pendingDelete.courseId} – ${pendingDelete.courseName}? This cannot be undone.`
        : ''
    "
    confirm-label="Delete"
    :busy="deletingId !== null"
    @confirm="confirmDelete"
    @cancel="pendingDelete = null"
  />
</template>
