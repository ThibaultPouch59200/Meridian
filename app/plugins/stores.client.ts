import { useEventsStore } from '~/stores/events'
import { useTagsStore } from '~/stores/tags'

export default defineNuxtPlugin(() => {
  const eventsStore = useEventsStore()
  const tagsStore = useTagsStore()
  eventsStore.load()
  tagsStore.load()
})
