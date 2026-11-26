<script setup>
import { computed, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import BaseCard from '@/components/BaseCard.vue';
import FormField from '@/components/FormField.vue';
import { useStudentStore } from '@/stores/students';

const store = useStudentStore();
const { adding } = storeToRefs(store);

const emptyForm = () => ({ name: '', id: '', phone: '', zip: '' });
const form = reactive(emptyForm());
const touched = reactive({ name: false, id: false, phone: false, zip: false });
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

const errors = computed(() =>
  Object.fromEntries(Object.keys(validators).map((key) => [key, validators[key](form[key])])),
);
const isValid = computed(() => Object.values(errors.value).every((msg) => !msg));

// Only show a field's error after the user has left it or tried to submit.
const visibleError = (key) => (touched[key] || submitted.value ? errors.value[key] : '');

function reset() {
  Object.assign(form, emptyForm());
  Object.keys(touched).forEach((key) => (touched[key] = false));
  submitted.value = false;
}

async function onSubmit() {
  submitted.value = true;
  if (!isValid.value) return;

  const ok = await store.addStudent({
    name: form.name.trim(),
    id: form.id.trim(),
    phone: form.phone.trim(),
    zip: form.zip.trim(),
  });
  if (ok) reset();
}
</script>

<template>
  <BaseCard title="Add a Student" heading-id="add-heading">
    <form class="form form-grid" novalidate @submit.prevent="onSubmit">
      <FormField
        id="add-name"
        v-model="form.name"
        label="Name"
        autocomplete="name"
        :error="visibleError('name')"
        required
        @blur="touched.name = true"
      />
      <FormField
        id="add-id"
        v-model="form.id"
        label="Student ID"
        inputmode="numeric"
        placeholder="e.g. 1001"
        :error="visibleError('id')"
        required
        @blur="touched.id = true"
      />
      <FormField
        id="add-phone"
        v-model="form.phone"
        label="Phone"
        type="tel"
        autocomplete="tel"
        placeholder="e.g. 555-1234"
        :error="visibleError('phone')"
        required
        @blur="touched.phone = true"
      />
      <FormField
        id="add-zip"
        v-model="form.zip"
        label="ZIP code"
        inputmode="numeric"
        autocomplete="postal-code"
        placeholder="e.g. 77001"
        :error="visibleError('zip')"
        required
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
