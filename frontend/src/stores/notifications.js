import { defineStore } from 'pinia';
import { ref } from 'vue';

// Global toast-style messages that any view or component can raise.
export const useNotificationStore = defineStore('notifications', () => {
  const items = ref([]);
  let nextId = 1;

  function dismiss(id) {
    items.value = items.value.filter((item) => item.id !== id);
  }

  function notify(type, message, timeout = 4000) {
    const id = nextId++;
    items.value.push({ id, type, message });
    if (timeout > 0) {
      setTimeout(() => dismiss(id), timeout);
    }
    return id;
  }

  const success = (message) => notify('success', message);
  const error = (message) => notify('error', message, 6000);
  const info = (message) => notify('info', message);

  return { items, notify, success, error, info, dismiss };
});
