<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import EmptyState from '@/components/EmptyState.vue';
import PageHeader from '@/components/PageHeader.vue';
import CourseRoster from '@/components/enrollments/CourseRoster.vue';
import EnrollmentForm from '@/components/enrollments/EnrollmentForm.vue';
import { useCourseStore } from '@/stores/courses';
import { useStudentStore } from '@/stores/students';

const studentStore = useStudentStore();
const courseStore = useCourseStore();
const { directoryError } = storeToRefs(studentStore);
const { loadError: courseError } = storeToRefs(courseStore);

const loadingOptions = ref(true);

async function loadOptions() {
  loadingOptions.value = true;
  await Promise.all([studentStore.fetchDirectory(), courseStore.fetchCourses()]);
  loadingOptions.value = false;
}

// Refresh students and courses every time the view opens so selections
// reflect anything added or deleted on the other pages.
onMounted(loadOptions);
</script>

<template>
  <PageHeader title="Enrollments" subtitle="Enroll students in courses and view course rosters." />

  <EmptyState
    v-if="!loadingOptions && (directoryError || courseError)"
    class="page-alert"
    :message="directoryError || courseError"
    tone="warning"
  >
    <button type="button" class="btn btn-secondary btn-sm retry" @click="loadOptions">Try again</button>
  </EmptyState>

  <div class="grid-2">
    <EnrollmentForm :loading="loadingOptions" />
    <CourseRoster :loading="loadingOptions" />
  </div>
</template>
