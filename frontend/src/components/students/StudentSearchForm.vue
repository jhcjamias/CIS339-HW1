<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import BaseCard from '@/components/BaseCard.vue';
import FormField from '@/components/FormField.vue';
import { useStudentStore } from '@/stores/students';

const store = useStudentStore();
const { loading, isSearching } = storeToRefs(store);

const term = ref(store.query);
const error = ref('');

async function onSubmit() {
  if (!term.value.trim()) {
    error.value = 'Enter a name or student ID to search.';
    return;
  }
  error.value = '';
  await store.search(term.value);
}

async function onShowAll() {
  term.value = '';
  error.value = '';
  await store.showAll();
}
</script>

<template>
  <BaseCard title="Search for a Student" heading-id="search-heading">
    <form class="form" role="search" novalidate @submit.prevent="onSubmit">
      <FormField
        id="search-name"
        v-model="term"
        label="Name or student ID"
        placeholder="e.g. John or 1001"
        hint="Names match partially and ignore case. IDs must match exactly."
        :error="error"
      />
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading && isSearching ? 'Searching…' : 'Search' }}
        </button>
        <button type="button" class="btn btn-secondary" :disabled="loading" @click="onShowAll">
          Show all
        </button>
      </div>
    </form>
  </BaseCard>
</template>
