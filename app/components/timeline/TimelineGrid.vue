<template>
  <div
    ref="gridRef"
    class="relative min-h-full cursor-crosshair select-none"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="cancelDrag"
  >
    <CurrentTimeLine :current-date="currentDate" />
    <TimelineHourRow v-for="hour in hours" :key="hour" :hour="hour" />

    <div class="absolute inset-0 left-16 pointer-events-none">
      <div
        v-for="event in dayEvents"
        :key="event.id"
        class="absolute pointer-events-auto"
        :style="eventStyle(event)"
      >
        <EventBar
          :event="event"
          class="h-full"
          @click="$emit('event-click', event)"
          @delete="$emit('event-delete', event.id)"
        />
      </div>

      <div
        v-if="isDragging"
        class="absolute left-2 right-4 rounded border border-blue-300 dark:border-blue-400 bg-blue-50/60 dark:bg-blue-900/30 pointer-events-none"
        :style="{ top: `${dragPreviewTop}px`, height: `${dragPreviewHeight}px` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~~/types'
import { HOUR_ROW_PX, minutesToPx, pxToMinutes, snapToGrid, minutesToTime, timeToMinutes } from '~/utils/timeline'

const props = defineProps<{
  currentDate: string
  dayEvents: CalendarEvent[]
}>()

const emit = defineEmits<{
  'event-click': [event: CalendarEvent]
  'event-delete': [id: string]
  'create': [{ startTime: string; endTime: string }]
}>()

const hours = Array.from({ length: 24 }, (_, i) => i)
const gridRef = ref<HTMLElement>()
const isDragging = ref(false)
const dragStartMin = ref(0)
const dragCurrentMin = ref(0)

const eventLayouts = computed(() => {
  const sorted = [...props.dayEvents].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  const assignments = new Map<string, number>()
  const colEnds: number[] = []

  for (const event of sorted) {
    const start = timeToMinutes(event.startTime)
    const end = timeToMinutes(event.endTime)
    let col = colEnds.findIndex(colEnd => colEnd <= start)
    if (col === -1) { col = colEnds.length; colEnds.push(end) }
    else { colEnds[col] = end }
    assignments.set(event.id, col)
  }

  const result = new Map<string, { col: number; totalCols: number }>()
  for (const event of props.dayEvents) {
    const eStart = timeToMinutes(event.startTime)
    const eEnd = timeToMinutes(event.endTime)
    let maxCol = 0
    for (const other of props.dayEvents) {
      if (timeToMinutes(other.startTime) < eEnd && timeToMinutes(other.endTime) > eStart)
        maxCol = Math.max(maxCol, assignments.get(other.id) ?? 0)
    }
    result.set(event.id, { col: assignments.get(event.id) ?? 0, totalCols: maxCol + 1 })
  }
  return result
})

function eventStyle(event: CalendarEvent) {
  const { col, totalCols } = eventLayouts.value.get(event.id) ?? { col: 0, totalCols: 1 }
  const top = minutesToPx(timeToMinutes(event.startTime))
  const height = Math.max(minutesToPx(timeToMinutes(event.endTime) - timeToMinutes(event.startTime)), 20)
  const gap = 3
  return {
    top: `${top}px`,
    height: `${height}px`,
    left: `calc(${(col / totalCols) * 100}% + ${gap}px)`,
    width: `calc(${(1 / totalCols) * 100}% - ${gap * 2}px)`,
  }
}

function getMinutesFromY(clientY: number): number {
  const rect = gridRef.value?.getBoundingClientRect()
  if (!rect) return 0
  return snapToGrid(Math.max(0, pxToMinutes(clientY - rect.top)), 15)
}

function onMouseDown(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.event-bar')) return
  isDragging.value = true
  const min = getMinutesFromY(e.clientY)
  dragStartMin.value = min
  dragCurrentMin.value = min + 60
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  const min = getMinutesFromY(e.clientY)
  dragCurrentMin.value = Math.max(dragStartMin.value + 15, min)
}

function onMouseUp() {
  if (!isDragging.value) return
  isDragging.value = false
  emit('create', {
    startTime: minutesToTime(dragStartMin.value),
    endTime: minutesToTime(dragCurrentMin.value),
  })
}

function cancelDrag() {
  isDragging.value = false
}

const dragPreviewTop = computed(() => minutesToPx(Math.min(dragStartMin.value, dragCurrentMin.value)))
const dragPreviewHeight = computed(() => Math.max(minutesToPx(Math.abs(dragCurrentMin.value - dragStartMin.value)), minutesToPx(15)))
</script>
