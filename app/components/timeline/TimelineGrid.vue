<template>
  <div class="relative min-h-full">
    <CurrentTimeLine :current-date="currentDate" />
    <TimelineHourRow
      v-for="hour in hours"
      :key="hour"
      :hour="hour"
      :events="dayEvents"
      @event-click="$emit('event-click', $event)"
      @event-delete="$emit('event-delete', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~~/types'

defineProps<{
  currentDate: string
  dayEvents: CalendarEvent[]
}>()

defineEmits<{
  'event-click': [event: CalendarEvent]
  'event-delete': [id: string]
}>()

const hours = Array.from({ length: 24 }, (_, i) => i)
</script>
