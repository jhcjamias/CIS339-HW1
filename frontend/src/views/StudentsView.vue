<script setup>
import { onMounted } from 'vue';
import PageHeader from '@/components/PageHeader.vue';
import StudentSearchForm from '@/components/students/StudentSearchForm.vue';
import StudentAddForm from '@/components/students/StudentAddForm.vue';
import StudentResults from '@/components/students/StudentResults.vue';

onMounted(() => {
  document.getElementById('search-name')?.focus();
});
</script>

<template>
  <PageHeader title="Students" subtitle="Add, search, view, and remove students." />
  <div class="grid-2">
    <StudentSearchForm />
    <StudentAddForm />
  </div>
  <StudentResults />
</template>
