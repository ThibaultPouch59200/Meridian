import { defineStore } from 'pinia'
import type { Task, QuadrantId } from '~~/types'

export const useMatrixStore = defineStore('matrix', {
  state: () => ({
    tasks: {
      inu: [],
      iu: [],
      ninu: [],
      niu: [],
      today: [],
      tomorrow: [],
    } as Record<QuadrantId, Task[]>,
    notes: '',
  }),
  actions: {
    async fetch() {
      const [tasksData, notesData] = await Promise.all([
        $fetch<Record<QuadrantId, Task[]>>('/api/matrix/tasks'),
        $fetch<{ content: string }>('/api/matrix/notes'),
      ])
      this.tasks = tasksData
      this.notes = notesData.content
    },
    async addTask(quadrant: QuadrantId, text = ''): Promise<string> {
      const task = await $fetch<Task>('/api/matrix/tasks', {
        method: 'POST',
        body: { quadrant, text },
      })
      this.tasks[quadrant].push(task)
      await this.reorderTasks(quadrant)
      return task.id
    },
    async addTaskAt(quadrant: QuadrantId, afterIndex: number): Promise<string> {
      const task = await $fetch<Task>('/api/matrix/tasks', {
        method: 'POST',
        body: { quadrant, text: '' },
      })
      this.tasks[quadrant].splice(afterIndex + 1, 0, task)
      await this.reorderTasks(quadrant)
      return task.id
    },
    async updateTask(quadrant: QuadrantId, id: string, patch: Partial<Task>) {
      await $fetch(`/api/matrix/tasks/${id}`, {
        method: 'PUT',
        body: patch,
      })
      const task = this.tasks[quadrant].find(t => t.id === id)
      if (task) Object.assign(task, patch)
    },
    async deleteTask(quadrant: QuadrantId, id: string) {
      await $fetch(`/api/matrix/tasks/${id}`, { method: 'DELETE' })
      this.tasks[quadrant] = this.tasks[quadrant].filter(t => t.id !== id)
      await this.reorderTasks(quadrant)
    },
    async reorderTasks(quadrant: QuadrantId) {
      await $fetch('/api/matrix/tasks/reorder', {
        method: 'PUT',
        body: { quadrant, ids: this.tasks[quadrant].map(t => t.id) },
      })
    },
    async setNotes(value: string) {
      this.notes = value
      await $fetch('/api/matrix/notes', {
        method: 'PUT',
        body: { content: value },
      })
    },
  },
})
