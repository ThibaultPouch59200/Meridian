import { useEventsStore } from '~/stores/events'
import { useTagsStore } from '~/stores/tags'
import { useMatrixStore } from '~/stores/matrix'

export default defineNuxtPlugin(async () => {
  const eventsStore = useEventsStore()
  const tagsStore = useTagsStore()
  const matrixStore = useMatrixStore()
  tagsStore.load()
  await Promise.all([
    eventsStore.fetch(),
    matrixStore.fetch(),
  ])
})
