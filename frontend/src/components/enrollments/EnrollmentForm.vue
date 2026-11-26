<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import BaseCard from '@/components/BaseCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import FormSelect from '@/components/FormSelect.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { useCourseStore } from '@/stores/courses';
import { useEnrollmentStore } from '@/stores/enrollments';
import { useStudentStore } from '@/stores/students';
import { useFocusFirstError } from '@/composables/useFocusFirstError';

const { formEl, focusFirstError } = useFocusFirstError();

const props = defineProps({
  loading: { type: Boolean, default: false },
});

const studentStore = useStudentStore();
const courseStore = useCourseStore();
const enrollmentStore = useEnrollmentStore();

const { directory } = storeToRefs(studentStore);
const { courses } = storeToRefs(courseStore);
const { enrolling, rosterCourseId, rosterStudents } = storeToRefs(enrollmentStore);

const studentId = ref('');
const courseId = ref('');
const submitted = ref(false);
const serverErrors = reactive({});

// Options come from the backend, never hard-coded.
const studentOptions = computed(() =>
  directory.value.map((s) => ({ value: s.id, label: `${s.name} (ID ${s.id})` })),
);
const courseOptions = computed(() =>
  courses.value.map((c) => ({ value: c.courseId, label: `${c.courseId} – ${c.courseName}` })),
);

// If the roster on screen is for the chosen course, warn before submitting.
const alreadyEnrolled = computed(
  () =>
    !!studentId.value &&
    !!courseId.value &&
    rosterCourseId.value === courseId.value &&
    rosterStudents.value.some((s) => s.id === studentId.value),
);

const errors = computed(() => ({
  studentId:
    (submitted.value && !studentId.value ? 'Select a student.' : '') ||
    (alreadyEnrolled.value ? 'This student is already enrolled in the selected course.' : '') ||
    serverErrors.studentId ||
    '',
  courseId: (submitted.value && !courseId.value ? 'Select a course.' : '') || serverErrors.courseId || '',
}));

const noOptions = computed(() => !props.loading && (!directory.value.length || !courses.value.length));

// Clear server errors once the user changes a selection.
watch([studentId, courseId], () => {
  delete serverErrors.studentId;
  delete serverErrors.courseId;
});

// Drop a selection if that student or course disappears from the options.
watch(directory, (list) => {
  if (studentId.value && !list.some((s) => s.id === studentId.value)) studentId.value = '';
});
watch(courses, (list) => {
  if (courseId.value && !list.some((c) => c.courseId === courseId.value)) courseId.value = '';
});

async function onSubmit() {
  submitted.value = true;
  if (!studentId.value || !courseId.value || alreadyEnrolled.value) {
    focusFirstError();
    return;
  }

  const result = await enrollmentStore.enroll(studentId.value, courseId.value);
  if (result.ok) {
    studentId.value = '';
    submitted.value = false;
  } else {
    Object.assign(serverErrors, result.fields);
    focusFirstError();
  }
}
</script>

<template>
  <BaseCard title="Enroll a Student" heading-id="enroll-heading">
    <LoadingSpinner v-if="loading" label="Loading students and courses…" />

    <EmptyState v-else-if="noOptions" message="You need at least one student and one course to create an enrollment.">
      <span class="empty-links">
        <RouterLink v-if="!directory.length" to="/students">Add a student</RouterLink>
        <RouterLink v-if="!courses.length" to="/courses">Add a course</RouterLink>
      </span>
    </EmptyState>

    <form v-else ref="formEl" class="form" novalidate @submit.prevent="onSubmit">
      <FormSelect
        id="enroll-student"
        v-model="studentId"
        label="Student"
        placeholder="Select a student"
        :options="studentOptions"
        :error="errors.studentId"
        required
      />
      <FormSelect
        id="enroll-course"
        v-model="courseId"
        label="Course"
        placeholder="Select a course"
        :options="courseOptions"
        :error="errors.courseId"
        required
      />
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="enrolling || alreadyEnrolled">
          {{ enrolling ? 'Enrolling…' : 'Enroll' }}
        </button>
      </div>
    </form>
  </BaseCard>
</template>
