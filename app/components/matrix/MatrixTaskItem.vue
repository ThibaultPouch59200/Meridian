<template>
  <div class="flex items-center gap-[7px] py-[3px]">
    <input
      type="checkbox"
      :checked="task.done"
      class="matrix-checkbox"
      @change="toggle"
    />
    <span
      v-if="!editing"
      :class="[
        'text-[13px] flex-1 cursor-text leading-tight min-h-[16px]',
        task.done ? 'line-through text-gray-400' : 'text-black dark:text-[#f0f0ee]',
      ]"
      @click="startEdit"
    >{{ task.text || ' ' }}</span>
    <input
      v-else
      ref="inputRef"
      v-model="localText"
      type="text"
      class="text-[13px] flex-1 bg-transparent border-none outline-none border-b border-gray-200 dark:border-[#2e2e2e] text-black dark:text-[#f0f0ee] font-sans leading-tight"
      placeholder="Tâche..."
      @blur="commit"
      @keydown.enter.prevent="commitAndAddNext"
      @keydown.backspace="handleBackspace"
    />
  </div>
</template>

<script setup lang="ts">
import type { Task, QuadrantId } from '~~/types'

const props = defineProps<{
  task: Task
  quadrantId: QuadrantId
}>()

const emit = defineEmits<{
  addNext: []
  focusPrev: []
}>()

const store = useMatrixStore()
const editing = ref(false)
const localText = ref(props.task.text)
const inputRef = ref<HTMLInputElement | null>(null)

watch(editing, (val) => {
  if (val) nextTick(() => inputRef.value?.focus())
})

function startEdit() {
  if (!props.task.done) {
    localText.value = props.task.text
    editing.value = true
  }
}

function toggle() {
  store.updateTask(props.quadrantId, props.task.id, { done: !props.task.done })
}

function commit() {
  const text = localText.value.trim()
  if (!text) {
    store.deleteTask(props.quadrantId, props.task.id)
  } else {
    store.updateTask(props.quadrantId, props.task.id, { text })
  }
  editing.value = false
}

function commitAndAddNext() {
  const text = localText.value.trim()
  if (text) {
    store.updateTask(props.quadrantId, props.task.id, { text })
  }
  editing.value = false
  emit('addNext')
}

function handleBackspace(e: KeyboardEvent) {
  if (localText.value === '') {
    e.preventDefault()
    store.deleteTask(props.quadrantId, props.task.id)
    emit('focusPrev')
  }
}

function focus() {
  localText.value = props.task.text
  editing.value = true
}

defineExpose({ focus })
</script>
