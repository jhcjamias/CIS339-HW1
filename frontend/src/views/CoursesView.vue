<script setup>
import PageHeader from '@/components/PageHeader.vue';
import CourseAddForm from '@/components/courses/CourseAddForm.vue';
import CourseList from '@/components/courses/CourseList.vue';
</script>

<template>
  <PageHeader title="Courses" subtitle="Add, list, and remove courses." />
  <div class="grid-2">
    <CourseAddForm />
    <CourseList />
  </div>
</template>
