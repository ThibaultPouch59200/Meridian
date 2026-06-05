<template>
  <div class="flex-1 flex flex-col overflow-hidden p-5 gap-3 min-h-0">
    <!-- Weekday headers -->
    <div class="grid grid-cols-7">
      <div
        v-for="day in weekdays"
        :key="day"
        class="text-center text-[10px] font-semibold tracking-[1px] uppercase text-gray-400 py-1.5"
      >
        {{ day }}
      </div>
    </div>
    <!-- Days grid -->
    <div
      class="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 overflow-hidden flex-1"
      style="grid-template-rows: repeat(6, 1fr)"
    >
      <div
        v-for="cell in cells"
        :key="cell.key"
        :class="[
          'bg-white p-2 cursor-pointer flex flex-col gap-[3px] overflow-hidden transition-colors duration-150 hover:bg-gray-50',
          !cell.currentMonth && 'bg-gray-50',
          cell.isSelected && 'outline outline-2 -outline-offset-2 outline-black',
        ]"
        @click="$emit('select-date', cell.key)"
      >
        <div
          :class="[
            'text-xs font-medium leading-[22px]',
            !cell.currentMonth && 'text-gray-400',
            cell.isToday
              ? 'bg-black text-white w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-semibold'
              : '',
          ]"
        >
          {{ cell.day }}
        </div>
        <div v-if="cell.events.length" class="flex flex-col gap-[2px] overflow-hidden">
          <div
            v-for="ev in cell.events.slice(0, 3)"
            :key="ev.id"
            class="text-[9px] font-medium px-[5px] py-[1px] rounded-[2px] truncate opacity-[.85]"
            :style="{ background: colorBg(ev.color), color: ev.color }"
          >
            {{ ev.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~~/types'
import { EVENT_COLOR_BG } from '~/stores/events'

const props = defineProps<{
  year: number
  month: number
  selectedDate: string
  eventsForDate: (date: string) => CalendarEvent[]
}>()

defineEmits<{ 'select-date': [date: string] }>()

const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const cells = computed(() => {
  const firstDay = new Date(props.year, props.month, 1)
  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1
  const todayKey = dateKey(new Date())

  return Array.from({ length: 42 }, (_, i) => {
    const cellDate = new Date(props.year, props.month, 1 + (i - startDow))
    const key = dateKey(cellDate)
    return {
      key,
      day: cellDate.getDate(),
      currentMonth: cellDate.getMonth() === props.month,
      isToday: key === todayKey,
      isSelected: key === props.selectedDate,
      events: props.eventsForDate(key),
    }
  })
})

function colorBg(color: string): string {
  return EVENT_COLOR_BG[color] ?? 'rgba(74,144,217,0.12)'
}
</script>
