<script setup>
import { computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import BaseCard from '@/components/BaseCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import FormSelect from '@/components/FormSelect.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { useCourseStore } from '@/stores/courses';
import { useEnrollmentStore } from '@/stores/enrollments';

const props = defineProps({
  loading: { type: Boolean, default: false },
});

const route = useRoute();
const router = useRouter();
const courseStore = useCourseStore();
const enrollmentStore = useEnrollmentStore();

const { courses } = storeToRefs(courseStore);
const { rosterCourseId, rosterCourse, rosterStudents, rosterLoading, rosterError, rosterCount } =
  storeToRefs(enrollmentStore);

const courseOptions = computed(() =>
  courses.value.map((c) => ({ value: c.courseId, label: `${c.courseId} – ${c.courseName}` })),
);

// Two-way binding between the select and the store's roster course.
const selectedCourse = computed({
  get: () => rosterCourseId.value,
  set: (value) => enrollmentStore.loadRoster(value),
});

const title = computed(() =>
  rosterCourse.value ? `Enrolled in ${rosterCourse.value.courseId} (${rosterCount.value})` : 'Course Roster',
);

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const formatDate = (iso) => (iso ? dateFormat.format(new Date(iso)) : '—');

// Keep the selected course in the URL (?course=CIS%203339) so the roster
// survives a page refresh and can be linked to.
watch(rosterCourseId, (value) => {
  if ((route.query.course ?? '') !== value) {
    router.replace({ query: { ...route.query, course: value || undefined } });
  }
});

onMounted(() => {
  const fromUrl = typeof route.query.course === 'string' ? route.query.course : '';
  enrollmentStore.loadRoster(fromUrl || rosterCourseId.value);
});
</script>

<template>
  <BaseCard :title="title" heading-id="roster-heading">
    <div class="form roster-picker">
      <FormSelect
        id="roster-course"
        v-model="selectedCourse"
        label="Course"
        placeholder="Select a course to see its students"
        :options="courseOptions"
        :disabled="props.loading || !courses.length"
      />
    </div>

    <div aria-live="polite">
      <LoadingSpinner v-if="rosterLoading" label="Loading enrolled students…" />
      <EmptyState v-else-if="rosterError" :message="rosterError" tone="warning" />
      <EmptyState v-else-if="!rosterCourseId" message="Select a course to list its enrolled students." />
      <EmptyState
        v-else-if="!rosterStudents.length"
        :message="`No students are enrolled in ${rosterCourse?.courseId ?? rosterCourseId} yet.`"
      />
      <div v-else class="table-wrap">
        <table class="table">
          <caption class="sr-only">Students enrolled in {{ rosterCourse?.courseId }}</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Student ID</th>
              <th scope="col">Phone</th>
              <th scope="col">ZIP</th>
              <th scope="col">Enrolled</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in rosterStudents" :key="student.id">
              <td data-label="Name">{{ student.name }}</td>
              <td data-label="Student ID">{{ student.id }}</td>
              <td data-label="Phone">{{ student.phone }}</td>
              <td data-label="ZIP">{{ student.zip }}</td>
              <td data-label="Enrolled" class="nowrap">{{ formatDate(student.enrolledAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </BaseCard>
</template>
