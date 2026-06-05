import { useEventsStore } from '~/stores/events'

export function useEvents() {
  const store = useEventsStore()
  const dayEvents = computed(() => store.dayEvents)
  function eventsForDate(date: string) {
    return store.eventsForDate(date)
  }
  return { dayEvents, eventsForDate }
}
