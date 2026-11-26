<script setup>
import { useRoute } from 'vue-router';
import PageHeader from '@/components/PageHeader.vue';

const route = useRoute();
</script>

<template>
  <PageHeader title="Page not found" :subtitle="`There is no page at ${route.fullPath}.`" />
  <RouterLink to="/students" class="btn btn-primary">Go to Students</RouterLink>
</template>
