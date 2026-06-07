import { useEventsStore } from '~/stores/events'
import { useTagsStore } from '~/stores/tags'
import { useMatrixStore } from '~/stores/matrix'

export default defineNuxtPlugin(() => {
  const eventsStore = useEventsStore()
  const tagsStore = useTagsStore()
  const matrixStore = useMatrixStore()
  eventsStore.load()
  tagsStore.load()
  matrixStore.load()
})
