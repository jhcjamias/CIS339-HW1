<script setup>
import { storeToRefs } from 'pinia';
import { useNotificationStore } from '@/stores/notifications';

const store = useNotificationStore();
const { items } = storeToRefs(store);
</script>

<template>
  <div class="toasts" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div
        v-for="item in items"
        :key="item.id"
        class="toast"
        :class="`toast-${item.type}`"
        :role="item.type === 'error' ? 'alert' : 'status'"
      >
        <span>{{ item.message }}</span>
        <button
          type="button"
          class="toast-close"
          aria-label="Dismiss message"
          @click="store.dismiss(item.id)"
        >
          &times;
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
