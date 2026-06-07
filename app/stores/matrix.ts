import { defineStore } from 'pinia'
import type { Task, QuadrantId } from '~~/types'

const STORAGE_KEY = 'meridian_matrix_v1'

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
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as { tasks?: Record<QuadrantId, Task[]>; notes?: string }
          if (parsed.tasks) this.tasks = parsed.tasks
          if (parsed.notes !== undefined) this.notes = parsed.notes
        }
      } catch { /* ignore */ }
    },
    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: this.tasks, notes: this.notes }))
    },
    addTask(quadrant: QuadrantId, text = ''): string {
      const id = Date.now().toString()
      this.tasks[quadrant].push({ id, text, done: false })
      this.save()
      return id
    },
    addTaskAt(quadrant: QuadrantId, afterIndex: number): string {
      const id = Date.now().toString()
      this.tasks[quadrant].splice(afterIndex + 1, 0, { id, text: '', done: false })
      this.save()
      return id
    },
    updateTask(quadrant: QuadrantId, id: string, patch: Partial<Task>) {
      const task = this.tasks[quadrant].find(t => t.id === id)
      if (task) {
        Object.assign(task, patch)
        this.save()
      }
    },
    deleteTask(quadrant: QuadrantId, id: string) {
      this.tasks[quadrant] = this.tasks[quadrant].filter(t => t.id !== id)
      this.save()
    },
    setNotes(value: string) {
      this.notes = value
      this.save()
    },
  },
})
