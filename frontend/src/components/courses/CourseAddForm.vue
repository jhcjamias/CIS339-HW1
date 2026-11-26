<script setup>
import { computed, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import BaseCard from '@/components/BaseCard.vue';
import FormField from '@/components/FormField.vue';
import { useFocusFirstError } from '@/composables/useFocusFirstError';
import { useCourseStore } from '@/stores/courses';

const store = useCourseStore();
const { formEl, focusFirstError } = useFocusFirstError();
const { adding } = storeToRefs(store);

const FIELDS = ['courseId', 'courseName'];
const emptyForm = () => ({ courseId: '', courseName: '' });

const form = reactive(emptyForm());
const touched = reactive({ courseId: false, courseName: false });
const serverErrors = reactive({});
const submitted = ref(false);

const validators = {
  courseId: (v) => {
    const value = v.trim();
    if (!value) return 'Course ID is required.';
    return /^[A-Za-z0-9][A-Za-z0-9 -]{1,19}$/.test(value)
      ? ''
      : 'Use letters, numbers, spaces, or hyphens (e.g. CIS 3339).';
  },
  courseName: (v) => {
    const value = v.trim();
    if (!value) return 'Course name is required.';
    return value.length <= 100 ? '' : 'Course name must be 100 characters or fewer.';
  },
};

const clientErrors = computed(() =>
  Object.fromEntries(FIELDS.map((key) => [key, validators[key](form[key])])),
);
const isValid = computed(() => Object.values(clientErrors.value).every((msg) => !msg));

function visibleError(key) {
  const client = touched[key] || submitted.value ? clientErrors.value[key] : '';
  return client || serverErrors[key] || '';
}

function onInput(key, value) {
  form[key] = value;
  delete serverErrors[key];
}

function reset() {
  Object.assign(form, emptyForm());
  FIELDS.forEach((key) => {
    touched[key] = false;
    delete serverErrors[key];
  });
  submitted.value = false;
}

async function onSubmit() {
  submitted.value = true;
  if (!isValid.value) {
    focusFirstError();
    return;
  }

  const result = await store.addCourse({
    courseId: form.courseId.trim(),
    courseName: form.courseName.trim(),
  });

  if (result.ok) {
    reset();
  } else {
    Object.assign(serverErrors, result.fields);
    focusFirstError();
  }
}
</script>

<template>
  <BaseCard title="Add a Course" heading-id="add-course-heading">
    <form ref="formEl" class="form" novalidate @submit.prevent="onSubmit">
      <p class="form-note">Fields marked <span class="required" aria-hidden="true">*</span> are required.</p>
      <FormField
        id="course-id"
        :model-value="form.courseId"
        label="Course ID"
        placeholder="e.g. CIS 3339"
        :error="visibleError('courseId')"
        required
        :disabled="adding"
        @update:model-value="onInput('courseId', $event)"
        @blur="touched.courseId = true"
      />
      <FormField
        id="course-name"
        :model-value="form.courseName"
        label="Course name"
        placeholder="e.g. Enterprise Applications Development"
        :error="visibleError('courseName')"
        required
        :disabled="adding"
        @update:model-value="onInput('courseName', $event)"
        @blur="touched.courseName = true"
      />
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="adding">
          {{ adding ? 'Adding…' : 'Add Course' }}
        </button>
        <button type="button" class="btn btn-secondary" :disabled="adding" @click="reset">
          Reset
        </button>
      </div>
    </form>
  </BaseCard>
</template>
