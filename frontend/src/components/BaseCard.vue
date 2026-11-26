<script setup>
defineProps({
  title: { type: String, required: true },
  headingId: { type: String, default: undefined },
});
</script>

<template>
  <section class="card" :aria-labelledby="headingId">
    <header class="card-header">
      <h2 :id="headingId">{{ title }}</h2>
      <slot name="actions" />
    </header>
    <div class="card-body">
      <slot />
    </div>
  </section>
</template>
