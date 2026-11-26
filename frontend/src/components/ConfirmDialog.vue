<script setup>
import { nextTick, ref, watch } from 'vue';

// Accessible confirmation dialog built on the native <dialog> element.
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['confirm', 'cancel']);

const dialogEl = ref(null);
const cancelBtn = ref(null);

watch(
  () => props.open,
  async (isOpen) => {
    const el = dialogEl.value;
    if (!el) return;
    if (isOpen && !el.open) {
      el.showModal();
      await nextTick();
      cancelBtn.value?.focus();
    } else if (!isOpen && el.open) {
      el.close();
    }
  },
);

function onCancel(event) {
  event.preventDefault();
  if (!props.busy) emit('cancel');
}
</script>

<template>
  <dialog
    ref="dialogEl"
    class="dialog"
    aria-labelledby="confirm-title"
    aria-describedby="confirm-message"
    @cancel="onCancel"
  >
    <h2 id="confirm-title">{{ title }}</h2>
    <p id="confirm-message">{{ message }}</p>
    <div class="dialog-actions">
      <button ref="cancelBtn" type="button" class="btn btn-secondary" :disabled="busy" @click="emit('cancel')">
        Cancel
      </button>
      <button type="button" class="btn btn-danger" :disabled="busy" @click="emit('confirm')">
        {{ busy ? 'Working…' : confirmLabel }}
      </button>
    </div>
  </dialog>
</template>
