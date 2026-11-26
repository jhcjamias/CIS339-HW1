<script setup>
import BaseCard from '@/components/BaseCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import PageHeader from '@/components/PageHeader.vue';
</script>

<template>
  <PageHeader title="Courses" subtitle="Manage the course catalog." />
  <BaseCard title="All Courses" heading-id="courses-heading">
    <EmptyState message="Course management is not available yet." />
  </BaseCard>
</template>
