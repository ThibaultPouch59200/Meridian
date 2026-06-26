<template>
  <div
    class="event-bar group hover:opacity-[.85] h-full overflow-hidden items-start"
    :style="{
      backgroundColor: colorBg,
      color: event.color,
      borderLeftColor: event.color,
    }"
    @click="$emit('click', event)"
  >
    <span class="text-[10px] font-medium opacity-70 whitespace-nowrap tabular-nums">
      {{ event.startTime }} – {{ event.endTime }}
    </span>
    <!-- Source badge -->
    <span
      class="text-[8px] font-bold flex-shrink-0 px-[4px] py-[1px] rounded-[2px] leading-tight"
      :style="{ background: 'currentColor' }"
    >
      <span style="color: white; mix-blend-mode: normal">{{ event.source === 'google' ? 'G' : 'M' }}</span>
    </span>
    <span class="text-xs font-medium flex-1 truncate">{{ event.name }}</span>
    <span
      v-if="event.tag"
      class="text-[9px] font-semibold tracking-[0.8px] uppercase opacity-65 px-[6px] py-[2px] rounded-[2px] bg-white/35 flex-shrink-0"
    >
      {{ event.tag }}
    </span>
    <button
      class="w-4 h-4 flex items-center justify-center rounded-[2px] bg-white/35 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 border-none cursor-pointer"
      style="color: inherit"
      @click.stop="$emit('delete', event.id)"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-[10px] h-[10px]" style="stroke-width:2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~~/types'
import { EVENT_COLOR_BG } from '~/stores/events'

const props = defineProps<{ event: CalendarEvent }>()
defineEmits<{
  click: [event: CalendarEvent]
  delete: [id: string]
}>()

const colorBg = computed(() => EVENT_COLOR_BG[props.event.color] ?? `${props.event.color}20`)
</script>
