<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import BaseCard from '@/components/BaseCard.vue';
import FormField from '@/components/FormField.vue';
import { useStudentStore } from '@/stores/students';

const store = useStudentStore();
const { searching } = storeToRefs(store);

const name = ref('');
const error = ref('');

async function onSubmit() {
  if (!name.value.trim()) {
    error.value = 'Enter a student name to search.';
    return;
  }
  error.value = '';
  await store.searchStudent(name.value);
}

function onClear() {
  name.value = '';
  error.value = '';
  store.clearResults();
}
</script>

<template>
  <BaseCard title="Search for a Student" heading-id="search-heading">
    <form class="form" novalidate @submit.prevent="onSubmit">
      <FormField
        id="search-name"
        v-model="name"
        label="Student name"
        placeholder="e.g. John"
        :error="error"
        required
      />
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="searching">
          {{ searching ? 'Searching…' : 'Search' }}
        </button>
        <button type="button" class="btn btn-secondary" :disabled="searching" @click="onClear">
          Clear
        </button>
      </div>
    </form>
  </BaseCard>
</template>
