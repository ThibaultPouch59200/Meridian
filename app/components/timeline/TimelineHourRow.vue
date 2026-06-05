<template>
  <div class="flex items-stretch border-b border-gray-100 relative min-h-14 hover:bg-black/[.01]">
    <div class="w-16 flex-shrink-0 pt-2 pl-6 pr-4 text-[11px] font-medium text-gray-400 tracking-[0.3px] tabular-nums select-none">
      {{ label }}
    </div>
    <div class="flex-1 flex flex-col relative">
      <div class="absolute inset-0 flex flex-col pointer-events-none">
        <div v-for="q in 4" :key="q" class="flex-1 border-b border-gray-100 last:border-b-0" />
      </div>
      <div class="relative z-[1] py-1 pl-2 pr-4 flex flex-col gap-[3px] min-h-12">
        <EventBar
          v-for="event in eventsInHour"
          :key="event.id"
          :event="event"
          @click="$emit('event-click', $event)"
          @delete="$emit('event-delete', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~~/types'

const props = defineProps<{
  hour: number
  events: CalendarEvent[]
}>()

defineEmits<{
  'event-click': [event: CalendarEvent]
  'event-delete': [id: string]
}>()

const label = computed(() => String(props.hour).padStart(2, '0') + ':00')

const eventsInHour = computed(() =>
  props.events.filter(e => parseInt(e.startTime.split(':')[0] ?? '0') === props.hour),
)
</script>
