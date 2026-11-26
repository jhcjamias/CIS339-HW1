<script setup>
defineProps({
  message: { type: String, required: true },
  tone: { type: String, default: 'neutral' }, // neutral | warning
});
</script>

<template>
  <p class="empty-state" :class="`empty-${tone}`">
    {{ message }}
    <slot />
  </p>
</template>
