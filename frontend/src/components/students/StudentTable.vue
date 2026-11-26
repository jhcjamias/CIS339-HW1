<script setup>
defineProps({
  students: { type: Array, required: true },
  selectedId: { type: String, default: null },
  deletingId: { type: String, default: null },
});
const emit = defineEmits(['select', 'delete']);
</script>

<template>
  <div class="table-wrap">
    <table class="table">
      <caption class="sr-only">Students</caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Student ID</th>
          <th scope="col">Phone</th>
          <th scope="col">ZIP</th>
          <th scope="col"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="student in students"
          :key="student.id"
          :class="{ 'is-selected': student.id === selectedId }"
        >
          <td data-label="Name">{{ student.name }}</td>
          <td data-label="Student ID">{{ student.id }}</td>
          <td data-label="Phone">{{ student.phone }}</td>
          <td data-label="ZIP">{{ student.zip }}</td>
          <td class="cell-actions">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              :aria-label="`View details for ${student.name}`"
              @click="emit('select', student.id)"
            >
              View
            </button>
            <button
              type="button"
              class="btn btn-danger btn-sm"
              :disabled="deletingId === student.id"
              :aria-label="`Delete student ${student.name}`"
              @click="emit('delete', student)"
            >
              {{ deletingId === student.id ? 'Deleting…' : 'Delete' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
