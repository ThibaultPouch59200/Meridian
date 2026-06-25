import { useDb } from '../../db'
import { events, googleCalendars } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { getValidAccessToken, callGoogleApi } from '../../utils/google'

interface GEvent {
  id: string
  summary?: string
  description?: string
  location?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  status: string
}

function parseGoogleEvent(g: GEvent, calId: string, calColor: string) {
  const allDay = !g.start.dateTime
  const startDate = allDay ? (g.start.date ?? '') : (g.start.dateTime ?? '').slice(0, 10)
  const startTime = allDay ? '00:00' : (g.start.dateTime ?? '').slice(11, 16)
  const endDate = allDay ? (g.end.date ?? '') : (g.end.dateTime ?? '').slice(0, 10)
  const endTime = allDay ? '23:59' : (g.end.dateTime ?? '').slice(11, 16)
  return {
    id: `gcal_${g.id}`,
    name: g.summary ?? '(sans titre)',
    desc: g.description ?? null,
    allDay: allDay ? 1 : 0,
    startDate,
    startTime,
    endDate,
    endTime,
    location: g.location ?? null,
    color: calColor,
    tag: '',
    source: 'google' as const,
    googleEventId: g.id,
    googleCalendarId: calId,
  }
}

export default defineEventHandler(async () => {
  const tokenData = await getValidAccessToken()
  if (!tokenData) return { ok: true, synced: 0 }

  const db = useDb()
  const cals = db.select().from(googleCalendars)
    .where(eq(googleCalendars.selected, 1))
    .all()

  if (cals.length === 0) return { ok: true, synced: 0 }

  const now = new Date()
  const minTime = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()
  const maxTime = new Date(now.getTime() + 90 * 24 * 3600 * 1000).toISOString()

  const seenGoogleIds = new Set<string>()
  let synced = 0

  for (const cal of cals) {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?timeMin=${minTime}&timeMax=${maxTime}&singleEvents=true&maxResults=2500`
    let resp: { items?: GEvent[] }
    try {
      resp = await callGoogleApi<{ items?: GEvent[] }>('GET', url, tokenData.token)
    } catch {
      continue
    }

    for (const g of (resp.items ?? [])) {
      if (g.status === 'cancelled') continue
      const parsed = parseGoogleEvent(g, cal.id, cal.color)
      seenGoogleIds.add(g.id)

      const existing = db.select({ id: events.id })
        .from(events)
        .where(eq(events.googleEventId, g.id))
        .all()[0]

      if (existing) {
        db.update(events).set({
          name: parsed.name,
          desc: parsed.desc,
          startDate: parsed.startDate,
          startTime: parsed.startTime,
          endDate: parsed.endDate,
          endTime: parsed.endTime,
          location: parsed.location,
          color: parsed.color,
          allDay: parsed.allDay,
          googleCalendarId: cal.id,
        }).where(eq(events.id, existing.id)).run()
      }
      else {
        db.insert(events).values(parsed).run()
      }
      synced++
    }
  }

  // Remove Google events that no longer exist in Google's response
  const allGoogleEvents = db.select({ id: events.id, googleEventId: events.googleEventId })
    .from(events)
    .where(eq(events.source, 'google'))
    .all()

  for (const e of allGoogleEvents) {
    if (e.googleEventId && !seenGoogleIds.has(e.googleEventId)) {
      db.delete(events).where(eq(events.id, e.id)).run()
    }
  }

  return { ok: true, synced }
})
