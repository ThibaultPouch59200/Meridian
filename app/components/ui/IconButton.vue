<template>
  <button
    :title="title"
    :class="[
      'w-9 h-9 flex items-center justify-center rounded-lg border-none transition-colors duration-150 cursor-pointer',
      active
        ? 'bg-white text-black shadow-sm'
        : 'bg-transparent text-gray-400 hover:bg-gray-100 hover:text-black',
    ]"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{ title: string; active?: boolean }>()
defineEmits<{ click: [] }>()
</script>
