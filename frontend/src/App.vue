<script setup>
import { nextTick, onUnmounted, ref } from 'vue';
import { START_LOCATION, useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import NotificationList from '@/components/NotificationList.vue';

const router = useRouter();
const mainEl = ref(null);

// After client-side navigation, move focus to the new page's heading so
// keyboard and screen-reader users start at the top of the new content.
// Skipped on the initial page load (so the skip link stays first in tab
// order) and for query-only changes like picking a roster course.
const removeHook = router.afterEach(async (to, from, failure) => {
  if (failure || from === START_LOCATION || to.path === from.path) return;
  await nextTick();
  const heading = mainEl.value?.querySelector('h1');
  (heading ?? mainEl.value)?.focus();
});
onUnmounted(removeHook);
</script>

<template>
  <a class="skip-link" href="#main">Skip to main content</a>
  <AppHeader />
  <main id="main" ref="mainEl" class="container" tabindex="-1">
    <RouterView />
  </main>
  <footer class="app-footer container">
    CIS 3339 &middot; Student Management System
  </footer>
  <NotificationList />
</template>
