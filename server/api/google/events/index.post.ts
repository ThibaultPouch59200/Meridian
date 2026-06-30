import { useDb } from '../../../db'
import { events } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { getValidAccessToken, callGoogleApi, ensureMeridianCalendar, toGoogleEventBody } from '../../../utils/google'
import type { CalendarEvent } from '~~/types'

export default defineEventHandler(async (event) => {
  const tokenData = await getValidAccessToken()
  if (!tokenData) throw createError({ statusCode: 401, message: 'No Google account linked' })

  const body = await readBody<CalendarEvent>(event)
  const calId = await ensureMeridianCalendar(tokenData.token, tokenData.accountId)

  const created = await callGoogleApi<{ id: string }>(
    'POST',
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`,
    tokenData.token,
    toGoogleEventBody(body),
  )

  const db = useDb()
  db.update(events)
    .set({ googleEventId: created.id, googleCalendarId: calId })
    .where(eq(events.id, body.id))
    .run()

  return { googleEventId: created.id, googleCalendarId: calId }
})
