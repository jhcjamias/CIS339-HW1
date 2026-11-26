<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
});
</script>

<template>
  <div class="page-header">
    <!-- tabindex="-1" lets App.vue move focus here after navigation. -->
    <h1 tabindex="-1">{{ title }}</h1>
    <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
  </div>
</template>
