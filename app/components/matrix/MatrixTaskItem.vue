<template>
  <div class="flex items-center gap-[7px] py-[3px]">
    <input
      type="checkbox"
      :checked="done"
      class="w-[13px] h-[13px] rounded-full border-[1.5px] border-gray-200 appearance-none cursor-pointer flex-shrink-0"
    />
    <span :class="['text-[11px]', done ? 'line-through text-gray-400' : 'text-black']">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text: string; done?: boolean }>()
</script>
