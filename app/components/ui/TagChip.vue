<template>
  <button
    :class="[
      'px-[10px] py-1 rounded-[3px] text-[10px] font-semibold tracking-[0.5px] border transition-all duration-150 font-sans cursor-pointer',
      selected
        ? 'bg-black text-white border-black'
        : 'bg-transparent text-gray-600 border-gray-200 hover:border-black hover:text-black',
    ]"
    @click="$emit('select', label)"
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">
defineProps<{ label: string; selected: boolean }>()
defineEmits<{ select: [label: string] }>()
</script>
