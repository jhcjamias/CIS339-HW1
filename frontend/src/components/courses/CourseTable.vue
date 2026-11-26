<script setup>
defineProps({
  courses: { type: Array, required: true },
  deletingId: { type: String, default: null },
});
const emit = defineEmits(['delete']);
</script>

<template>
  <div class="table-wrap">
    <table class="table">
      <caption class="sr-only">Courses</caption>
      <thead>
        <tr>
          <th scope="col">Course ID</th>
          <th scope="col">Course Name</th>
          <th scope="col"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="course in courses" :key="course.courseId">
          <td data-label="Course ID" class="nowrap">{{ course.courseId }}</td>
          <td data-label="Course Name">{{ course.courseName }}</td>
          <td class="cell-actions">
            <button
              type="button"
              class="btn btn-danger btn-sm"
              :disabled="deletingId === course.courseId"
              :aria-label="`Delete course ${course.courseId}`"
              @click="emit('delete', course)"
            >
              {{ deletingId === course.courseId ? 'Deleting…' : 'Delete' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
