import { defineStore } from 'pinia'

interface GoogleAccount {
  id: string
  googleEmail: string
  meridianCalendarId: string | null
  createdAt: number
}

interface GoogleCalendar {
  id: string
  googleAccountId: string
  name: string
  color: string
  selected: number
}

export const useGoogleStore = defineStore('google', {
  state: () => ({
    account: null as GoogleAccount | null,
    calendars: [] as GoogleCalendar[],
    syncing: false,
    lastSyncedAt: null as number | null,
  }),
  getters: {
    isConnected: (state): boolean => !!state.account,
    selectedCalendars: (state): GoogleCalendar[] => state.calendars.filter(c => c.selected === 1),
  },
  actions: {
    async fetchStatus() {
      try {
        const data = await $fetch<{ account: GoogleAccount | null; calendars: GoogleCalendar[] }>(
          '/api/google/status',
        )
        this.account = data.account
        this.calendars = data.calendars
      }
      catch {
        this.account = null
        this.calendars = []
      }
    },
    async sync() {
      if (!this.account || this.syncing) return
      this.syncing = true
      try {
        await $fetch('/api/google/sync', { method: 'POST' })
        this.lastSyncedAt = Date.now()
      }
      catch {}
      finally {
        this.syncing = false
      }
    },
    async updateCalendarColor(calId: string, color: string) {
      await $fetch(`/api/google/calendars/${calId}/color`, { method: 'PATCH', body: { color } })
      const cal = this.calendars.find(c => c.id === calId)
      if (cal) cal.color = color
    },
    async saveCalendarSelection(
      calendars: Array<{ id: string; name: string; color: string; selected: boolean }>,
    ) {
      await $fetch('/api/google/calendars/select', { method: 'POST', body: { calendars } })
      await this.fetchStatus()
    },
    async disconnect() {
      await $fetch('/api/auth/google/disconnect', { method: 'POST' })
      this.account = null
      this.calendars = []
    },
  },
})
