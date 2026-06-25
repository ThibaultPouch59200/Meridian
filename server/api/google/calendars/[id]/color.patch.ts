import { useDb } from '../../../../db'
import { googleCalendars, events } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const calId = getRouterParam(event, 'id')!
  const { color } = await readBody<{ color: string }>(event)
  const db = useDb()

  db.update(googleCalendars).set({ color }).where(eq(googleCalendars.id, calId)).run()
  db.update(events).set({ color }).where(eq(events.googleCalendarId, calId)).run()

  return { ok: true }
})
