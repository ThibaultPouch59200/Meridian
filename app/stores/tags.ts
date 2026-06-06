import { defineStore } from 'pinia'
import type { Tag } from '~~/types'

const STORAGE_KEY = 'meridian_tags_v1'

export const useTagsStore = defineStore('tags', {
  state: () => ({
    tags: [
      { label: 'Perso', builtIn: true },
      { label: 'Travail', builtIn: true },
    ] as Tag[],
  }),
  actions: {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as { tags?: Tag[] }
          this.tags = parsed.tags ?? this.tags
        }
      } catch { /* ignore */ }
    },
    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tags: this.tags }))
    },
    addTag(label: string) {
      if (!this.tags.find(t => t.label === label)) {
        this.tags.push({ label, builtIn: false })
        this.save()
      }
    },
  },
})
