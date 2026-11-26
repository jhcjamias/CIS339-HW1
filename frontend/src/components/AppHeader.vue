<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const links = [
  { to: '/students', label: 'Students' },
  { to: '/courses', label: 'Courses' },
];

const menuOpen = ref(false);
const route = useRoute();

// Close the mobile menu whenever the user navigates.
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
  },
);
</script>

<template>
  <header class="app-header">
    <div class="container header-inner">
      <RouterLink to="/" class="brand">Student Management</RouterLink>
      <button
        type="button"
        class="menu-toggle"
        :aria-expanded="menuOpen"
        aria-controls="primary-nav"
        @click="menuOpen = !menuOpen"
      >
        <span class="sr-only">Toggle navigation</span>
        <span aria-hidden="true">&#9776;</span>
      </button>
      <nav id="primary-nav" aria-label="Main" :class="{ open: menuOpen }">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to">
          {{ link.label }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
