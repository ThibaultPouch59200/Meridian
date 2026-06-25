<template>
  <div class="flex flex-col overflow-hidden" :class="containerClass">
    <div class="mb-2 pb-[7px] border-b border-gray-200 flex-shrink-0">
      <div class="text-[9px] font-semibold tracking-[1px] uppercase text-black">{{ title }}</div>
      <div v-if="subtitle" class="text-[9px] text-gray-400 mt-[1px] italic">{{ subtitle }}</div>
    </div>
    <VueDraggable
      v-model="store.tasks[quadrantId]"
      group="tasks"
      :animation="150"
      class="flex-1 overflow-y-auto scrollbar-thin"
      @end="store.reorderTasks(quadrantId)"
    >
      <MatrixTaskItem
        v-for="(task, index) in store.tasks[quadrantId]"
        :key="task.id"
        :ref="(el) => setItemRef(el, index)"
        :task="task"
        :quadrant-id="quadrantId"
        @add-next="addNext(index)"
        @focus-prev="focusPrev(index)"
      />
    </VueDraggable>
    <button
      class="text-[10px] text-gray-300 cursor-pointer pt-[3px] transition-colors hover:text-gray-600 bg-transparent border-none font-sans flex-shrink-0 text-left"
      @click="addTask"
    >
      + ajouter
    </button>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { QuadrantId } from '~~/types'

const props = defineProps<{
  title: string
  subtitle?: string
  containerClass?: string
  quadrantId: QuadrantId
}>()

const store = useMatrixStore()

type ItemRef = { focus: () => void } | null
const itemRefs = ref<ItemRef[]>([])

function setItemRef(el: unknown, index: number) {
  itemRefs.value[index] = el as ItemRef
}

async function addTask() {
  await store.addTask(props.quadrantId)
  await nextTick()
  const last = itemRefs.value[store.tasks[props.quadrantId].length - 1]
  last?.focus()
}

async function addNext(index: number) {
  await store.addTaskAt(props.quadrantId, index)
  await nextTick()
  itemRefs.value[index + 1]?.focus()
}

function focusPrev(index: number) {
  if (index > 0) itemRefs.value[index - 1]?.focus()
}
</script>
