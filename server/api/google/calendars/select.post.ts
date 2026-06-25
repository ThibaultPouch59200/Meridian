import { useDb } from '../../../db'
import { googleCalendars } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { getValidAccessToken } from '../../../utils/google'

interface CalendarEntry {
  id: string
  name: string
  color: string
  selected: boolean
}

export default defineEventHandler(async (event) => {
  const tokenData = await getValidAccessToken()
  if (!tokenData) throw createError({ statusCode: 401, message: 'No Google account linked' })

  const { calendars } = await readBody<{ calendars: CalendarEntry[] }>(event)
  const db = useDb()

  for (const cal of calendars) {
    const existing = db.select().from(googleCalendars)
      .where(eq(googleCalendars.id, cal.id))
      .all()[0]

    if (existing) {
      db.update(googleCalendars)
        .set({ selected: cal.selected ? 1 : 0, name: cal.name, color: cal.color })
        .where(eq(googleCalendars.id, cal.id))
        .run()
    }
    else {
      db.insert(googleCalendars).values({
        id: cal.id,
        googleAccountId: tokenData.accountId,
        name: cal.name,
        color: cal.color,
        selected: cal.selected ? 1 : 0,
      }).run()
    }
  }

  return { ok: true }
})
