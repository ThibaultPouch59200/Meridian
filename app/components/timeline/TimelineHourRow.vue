<template>
  <div
    class="flex items-stretch border-b border-gray-100"
    :style="`height: ${HOUR_ROW_PX}px`"
    :data-hour="hour"
  >
    <div class="w-16 flex-shrink-0 pt-2 pl-6 pr-4 text-[11px] font-medium text-gray-400 tracking-[0.3px] tabular-nums select-none pointer-events-none">
      {{ label }}
    </div>
    <div class="flex-1 relative pointer-events-none">
      <div class="absolute inset-0 flex flex-col">
        <div v-for="q in 4" :key="q" class="flex-1 border-b border-gray-100/50 last:border-b-0" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HOUR_ROW_PX } from '~/utils/timeline'

const props = defineProps<{ hour: number }>()
const label = computed(() => String(props.hour).padStart(2, '0') + ':00')
</script>
