<script setup>
import { computed } from 'vue';

// Labeled input with an inline validation message. Supports v-model.
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  inputmode: { type: String, default: undefined },
  autocomplete: { type: String, default: 'off' },
  disabled: { type: Boolean, default: false },
});

const model = defineModel({ type: String, default: '' });
const emit = defineEmits(['blur']);

const describedBy = computed(() => {
  const ids = [];
  if (props.hint) ids.push(`${props.id}-hint`);
  if (props.error) ids.push(`${props.id}-error`);
  return ids.length ? ids.join(' ') : undefined;
});
</script>

<template>
  <div class="field" :class="{ 'has-error': error }">
    <label :for="id">
      {{ label }}
      <span v-if="required" class="required" aria-hidden="true">*</span>
    </label>
    <input
      :id="id"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :inputmode="inputmode"
      :autocomplete="autocomplete"
      :required="required"
      :disabled="disabled"
      :aria-invalid="error ? 'true' : 'false'"
      :aria-describedby="describedBy"
      @blur="emit('blur')"
    />
    <p v-if="hint" :id="`${id}-hint`" class="field-hint">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" class="field-error">{{ error }}</p>
  </div>
</template>
