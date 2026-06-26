import { useDb } from '../../../db'
import { googleAccounts, events } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { getValidAccessToken, callGoogleApi } from '../../../utils/google'
import type { CalendarEvent } from '~~/types'

async function ensureMeridianCalendar(token: string, accountId: string): Promise<string> {
  const db = useDb()
  const account = db.select().from(googleAccounts).where(eq(googleAccounts.id, accountId)).all()[0]
  if (!account) throw createError({ statusCode: 500, message: 'Account not found' })

  if (account.meridianCalendarId) return account.meridianCalendarId

  const list = await callGoogleApi<{ items: { id: string; summary: string }[] }>(
    'GET',
    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
    token,
  )
  const existing = (list.items ?? []).find(c => c.summary === 'Meridian')
  if (existing) {
    db.update(googleAccounts).set({ meridianCalendarId: existing.id })
      .where(eq(googleAccounts.id, accountId)).run()
    return existing.id
  }

  const created = await callGoogleApi<{ id: string }>(
    'POST',
    'https://www.googleapis.com/calendar/v3/calendars',
    token,
    { summary: 'Meridian' },
  )
  db.update(googleAccounts).set({ meridianCalendarId: created.id })
    .where(eq(googleAccounts.id, accountId)).run()
  return created.id
}

function toGoogleEventBody(e: CalendarEvent) {
  if (e.allDay) {
    return {
      summary: e.name,
      description: e.desc,
      location: e.location,
      start: { date: e.startDate },
      end: { date: e.endDate },
    }
  }
  return {
    summary: e.name,
    description: e.desc,
    location: e.location,
    start: { dateTime: `${e.startDate}T${e.startTime}:00` },
    end: { dateTime: `${e.endDate}T${e.endTime}:00` },
  }
}

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
