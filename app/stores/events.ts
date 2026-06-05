import { defineStore } from 'pinia'
import type { CalendarEvent } from '~~/types'

export const EVENT_COLORS = [
  '#4a90d9', '#e05555', '#3bb87a', '#f0a832',
  '#9b72d0', '#e08040', '#5ab8c4', '#888888',
]

export const EVENT_COLOR_BG: Record<string, string> = {
  '#4a90d9': 'rgba(74,144,217,0.12)',
  '#e05555': 'rgba(224,85,85,0.12)',
  '#3bb87a': 'rgba(59,184,122,0.12)',
  '#f0a832': 'rgba(240,168,50,0.12)',
  '#9b72d0': 'rgba(155,114,208,0.12)',
  '#e08040': 'rgba(224,128,64,0.12)',
  '#5ab8c4': 'rgba(90,184,196,0.12)',
  '#888888': 'rgba(136,136,136,0.12)',
}

const STORAGE_KEY = 'meridian_events_v1'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const useEventsStore = defineStore('events', {
  state: () => ({
    events: [] as CalendarEvent[],
    currentDate: todayKey(),
    timelineMode: 'day' as 'day' | 'month',
  }),
  getters: {
    dayEvents: (state): CalendarEvent[] =>
      state.events.filter(e => e.startDate === state.currentDate),
    eventsForDate: (state) => (date: string): CalendarEvent[] =>
      state.events.filter(e => e.startDate === date),
  },
  actions: {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as { events?: CalendarEvent[] }
          this.events = parsed.events ?? []
        }
      } catch { /* ignore */ }
    },
    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ events: this.events }))
    },
    addEvent(event: Omit<CalendarEvent, 'id'>) {
      this.events.push({ ...event, id: Date.now().toString() })
      this.save()
    },
    updateEvent(updated: CalendarEvent) {
      const idx = this.events.findIndex(e => e.id === updated.id)
      if (idx !== -1) this.events[idx] = updated
      this.save()
    },
    deleteEvent(id: string) {
      this.events = this.events.filter(e => e.id !== id)
      this.save()
    },
    setCurrentDate(date: string) {
      this.currentDate = date
    },
    setTimelineMode(mode: 'day' | 'month') {
      this.timelineMode = mode
    },
  },
})
