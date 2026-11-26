<script setup>
defineProps({
  label: { type: String, default: 'Loading…' },
});
</script>

<template>
  <div class="loading" role="status">
    <span class="spinner" aria-hidden="true"></span>
    <span>{{ label }}</span>
  </div>
</template>
