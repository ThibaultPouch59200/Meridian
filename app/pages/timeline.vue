<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <!-- Header -->
    <header class="flex items-center justify-between px-7 py-[14px] pl-6 border-b border-gray-200 flex-shrink-0">
      <div class="flex items-center gap-4">
        <span class="font-display text-[20px] font-normal tracking-[-0.3px]">Timeline</span>

        <div class="flex items-center gap-1">
          <button
            :class="[
              'px-[10px] py-[5px] text-[11px] font-medium tracking-[0.5px] border rounded-[4px] transition-all font-sans cursor-pointer',
              store.timelineMode === 'day'
                ? 'bg-black text-white border-black'
                : 'bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-black',
            ]"
            @click="setMode('day')"
          >Jour</button>
          <button
            :class="[
              'px-[10px] py-[5px] text-[11px] font-medium tracking-[0.5px] border rounded-[4px] transition-all font-sans cursor-pointer',
              store.timelineMode === 'month'
                ? 'bg-black text-white border-black'
                : 'bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-black',
            ]"
            @click="setMode('month')"
          >Mois</button>
        </div>

        <div class="flex items-center gap-[10px]">
          <button
            class="w-7 h-7 border border-gray-200 rounded-[4px] flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-black transition-all bg-transparent cursor-pointer"
            @click="navigate(-1)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-3.5 h-3.5" style="stroke-width:1.8">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span class="text-[13px] font-medium min-w-[160px] text-center">{{ dateLabel }}</span>
          <button
            class="w-7 h-7 border border-gray-200 rounded-[4px] flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-black transition-all bg-transparent cursor-pointer"
            @click="navigate(1)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-3.5 h-3.5" style="stroke-width:1.8">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <button
            class="px-3 py-[5px] text-[11px] font-medium border border-gray-200 rounded-[4px] tracking-[0.3px] text-gray-600 hover:bg-gray-50 hover:text-black transition-all bg-transparent cursor-pointer font-sans"
            @click="goToday"
          >
            Aujourd'hui
          </button>
        </div>
      </div>

      <button class="btn-primary flex items-center gap-[6px]" @click="openNewEvent">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-[13px] h-[13px]" style="stroke-width:2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Ajouter
      </button>
    </header>

    <!-- Day View -->
    <div
      v-show="store.timelineMode === 'day'"
      ref="scrollRef"
      class="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
    >
      <TimelineGrid
        :current-date="store.currentDate"
        :day-events="store.dayEvents"
        @event-click="openEditEvent"
        @event-delete="(id) => store.deleteEvent(id)"
        @create="openNewEventAtTime"
      />
    </div>

    <!-- Month View -->
    <MonthCalendar
      v-show="store.timelineMode === 'month'"
      :year="calendarYear"
      :month="calendarMonth"
      :selected-date="store.currentDate"
      :events-for-date="(date: string) => store.eventsForDate(date)"
      @select-date="selectDateFromMonth"
    />

    <EventModal
      v-model:open="modalOpen"
      :initial-event="editingEvent ?? undefined"
      :initial-date="store.currentDate"
      :initial-start-time="newEventStart"
      :initial-end-time="newEventEnd"
      @save="saveEvent"
    />
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~~/types'
import { useEventsStore } from '~/stores/events'
import { HOUR_ROW_PX } from '~/utils/timeline'

const store = useEventsStore()
const scrollRef = ref<HTMLElement>()

const modalOpen = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)
const newEventStart = ref('09:00')
const newEventEnd = ref('10:00')

onMounted(() => {
  scrollToCurrentHour()
})

const currentDateObj = computed(() => {
  const parts = store.currentDate.split('-').map(Number)
  const y = parts[0] ?? new Date().getFullYear()
  const m = parts[1] ?? new Date().getMonth() + 1
  const d = parts[2] ?? new Date().getDate()
  return new Date(y, m - 1, d)
})

const calendarYear = computed(() => currentDateObj.value.getFullYear())
const calendarMonth = computed(() => currentDateObj.value.getMonth())

const dateLabel = computed(() => {
  const d = currentDateObj.value
  let label: string
  if (store.timelineMode === 'day') {
    label = d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  } else {
    label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }
  return label.charAt(0).toUpperCase() + label.slice(1)
})

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function navigate(dir: -1 | 1) {
  const d = new Date(currentDateObj.value)
  if (store.timelineMode === 'day') d.setDate(d.getDate() + dir)
  else d.setMonth(d.getMonth() + dir)
  store.setCurrentDate(dateKey(d))
}

function goToday() {
  store.setCurrentDate(dateKey(new Date()))
  if (store.timelineMode === 'day') nextTick(() => scrollToCurrentHour())
}

function setMode(mode: 'day' | 'month') {
  store.setTimelineMode(mode)
}

function selectDateFromMonth(date: string) {
  store.setCurrentDate(date)
  store.setTimelineMode('day')
  nextTick(() => scrollToCurrentHour())
}

function scrollToCurrentHour() {
  const todayKey = dateKey(new Date())
  if (store.currentDate !== todayKey || !scrollRef.value) return
  scrollRef.value.scrollTop = Math.max(0, (new Date().getHours() - 1) * HOUR_ROW_PX)
}

function openNewEvent() {
  editingEvent.value = null
  newEventStart.value = '09:00'
  newEventEnd.value = '10:00'
  modalOpen.value = true
}

function openNewEventAtTime({ startTime, endTime }: { startTime: string; endTime: string }) {
  editingEvent.value = null
  newEventStart.value = startTime
  newEventEnd.value = endTime
  modalOpen.value = true
}

function openEditEvent(event: CalendarEvent) {
  editingEvent.value = event
  modalOpen.value = true
}

function saveEvent(eventData: Omit<CalendarEvent, 'id'>) {
  if (editingEvent.value) {
    store.updateEvent({ ...eventData, id: editingEvent.value.id })
  } else {
    store.addEvent(eventData)
  }
  editingEvent.value = null
}
</script>
