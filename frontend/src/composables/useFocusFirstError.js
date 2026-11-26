import { nextTick, ref } from 'vue';

// Returns a template ref for a <form> and a function that moves keyboard
// focus to the first field marked aria-invalid="true" after a failed submit.
export function useFocusFirstError() {
  const formEl = ref(null);

  async function focusFirstError() {
    await nextTick();
    formEl.value?.querySelector('[aria-invalid="true"]')?.focus();
  }

  return { formEl, focusFirstError };
}
