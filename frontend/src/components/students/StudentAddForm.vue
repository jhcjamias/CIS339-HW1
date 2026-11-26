<script setup>
import { computed, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import BaseCard from '@/components/BaseCard.vue';
import FormField from '@/components/FormField.vue';
import { useFocusFirstError } from '@/composables/useFocusFirstError';
import { useStudentStore } from '@/stores/students';

const store = useStudentStore();
const { formEl, focusFirstError } = useFocusFirstError();
const { adding } = storeToRefs(store);

const FIELDS = ['name', 'id', 'phone', 'zip'];
const emptyForm = () => ({ name: '', id: '', phone: '', zip: '' });

const form = reactive(emptyForm());
const touched = reactive(Object.fromEntries(FIELDS.map((f) => [f, false])));
const serverErrors = reactive({}); // errors returned by the API, e.g. duplicate ID
const submitted = ref(false);

const validators = {
  name: (v) => (v.trim() ? '' : 'Name is required.'),
  id: (v) => {
    if (!v.trim()) return 'Student ID is required.';
    return /^\d+$/.test(v.trim()) ? '' : 'Student ID must contain digits only.';
  },
  phone: (v) => {
    if (!v.trim()) return 'Phone number is required.';
    return /^[\d\s()+-]{7,20}$/.test(v.trim()) ? '' : 'Enter a valid phone number (e.g. 555-1234).';
  },
  zip: (v) => {
    if (!v.trim()) return 'ZIP code is required.';
    return /^\d{5}(-\d{4})?$/.test(v.trim()) ? '' : 'ZIP code must be 5 digits (or ZIP+4).';
  },
};

const clientErrors = computed(() =>
  Object.fromEntries(FIELDS.map((key) => [key, validators[key](form[key])])),
);
const isValid = computed(() => Object.values(clientErrors.value).every((msg) => !msg));

// Show a client error once the field was left or the form submitted;
// a server error shows until the user edits that field.
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

  const result = await store.addStudent({
    name: form.name.trim(),
    id: form.id.trim(),
    phone: form.phone.trim(),
    zip: form.zip.trim(),
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
  <BaseCard title="Add a Student" heading-id="add-heading">
    <form ref="formEl" class="form form-grid" novalidate @submit.prevent="onSubmit">
      <p class="form-note span-all">Fields marked <span class="required" aria-hidden="true">*</span> are required.</p>
      <FormField
        id="add-name"
        :model-value="form.name"
        label="Name"
        autocomplete="name"
        :error="visibleError('name')"
        required
        :disabled="adding"
        @update:model-value="onInput('name', $event)"
        @blur="touched.name = true"
      />
      <FormField
        id="add-id"
        :model-value="form.id"
        label="Student ID"
        inputmode="numeric"
        placeholder="e.g. 1001"
        :error="visibleError('id')"
        required
        :disabled="adding"
        @update:model-value="onInput('id', $event)"
        @blur="touched.id = true"
      />
      <FormField
        id="add-phone"
        :model-value="form.phone"
        label="Phone"
        type="tel"
        autocomplete="tel"
        placeholder="e.g. 555-1234"
        :error="visibleError('phone')"
        required
        :disabled="adding"
        @update:model-value="onInput('phone', $event)"
        @blur="touched.phone = true"
      />
      <FormField
        id="add-zip"
        :model-value="form.zip"
        label="ZIP code"
        inputmode="numeric"
        autocomplete="postal-code"
        placeholder="e.g. 77001"
        :error="visibleError('zip')"
        required
        :disabled="adding"
        @update:model-value="onInput('zip', $event)"
        @blur="touched.zip = true"
      />
      <div class="form-actions span-all">
        <button type="submit" class="btn btn-primary" :disabled="adding">
          {{ adding ? 'Adding…' : 'Add Student' }}
        </button>
        <button type="button" class="btn btn-secondary" :disabled="adding" @click="reset">
          Reset
        </button>
      </div>
    </form>
  </BaseCard>
</template>
