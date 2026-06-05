<template>
  <div class="border border-gray-200 p-3 flex flex-col overflow-hidden" :class="borderClass">
    <div class="mb-2 pb-[7px] border-b border-gray-200 flex-shrink-0">
      <div class="text-[9px] font-semibold tracking-[1px] uppercase text-black">{{ title }}</div>
      <div v-if="subtitle" class="text-[9px] text-gray-400 mt-[1px] italic">{{ subtitle }}</div>
    </div>
    <div class="flex-1 overflow-y-auto">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  borderClass?: string
}>()
</script>
