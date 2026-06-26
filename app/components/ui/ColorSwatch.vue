<template>
  <button
    :style="{ background: color }"
    :class="[
      'w-[22px] h-[22px] rounded-full border-2 flex-shrink-0 transition-all duration-100 cursor-pointer',
      selected ? 'border-black dark:border-white scale-[1.08]' : 'border-transparent hover:scale-110',
    ]"
    @click="$emit('select', color)"
  />
</template>

<script setup lang="ts">
defineProps<{ color: string; selected: boolean }>()
defineEmits<{ select: [color: string] }>()
</script>
