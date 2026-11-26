<script setup>
import AppHeader from '@/components/AppHeader.vue';
import NotificationList from '@/components/NotificationList.vue';
</script>

<template>
  <a class="skip-link" href="#main">Skip to main content</a>
  <AppHeader />
  <main id="main" class="container" tabindex="-1">
    <RouterView />
  </main>
  <footer class="app-footer container">
    CIS 3339 &middot; Student Management System
  </footer>
  <NotificationList />
</template>
