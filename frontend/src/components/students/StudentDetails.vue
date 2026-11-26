<script setup>
defineProps({
  student: { type: Object, default: null },
  deleting: { type: Boolean, default: false },
});
const emit = defineEmits(['close', 'delete']);
</script>

<template>
  <div v-if="student" class="details">
    <dl class="details-list">
      <div>
        <dt>Name</dt>
        <dd>{{ student.name }}</dd>
      </div>
      <div>
        <dt>Student ID</dt>
        <dd>{{ student.id }}</dd>
      </div>
      <div>
        <dt>Phone</dt>
        <dd>{{ student.phone }}</dd>
      </div>
      <div>
        <dt>ZIP code</dt>
        <dd>{{ student.zip }}</dd>
      </div>
    </dl>
    <div class="form-actions">
      <button type="button" class="btn btn-danger" :disabled="deleting" @click="emit('delete', student)">
        {{ deleting ? 'Deleting…' : 'Delete student' }}
      </button>
      <button type="button" class="btn btn-secondary" @click="emit('close')">Close</button>
    </div>
  </div>
</template>
