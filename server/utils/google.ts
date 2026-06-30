import { useDb } from '../db'
import { googleAccounts, events } from '../db/schema'
import { eq, isNull } from 'drizzle-orm'
import type { CalendarEvent } from '~~/types'

const TOKEN_REFRESH_BUFFER_MS = 60_000

export async function getValidAccessToken(): Promise<{ token: string; accountId: string } | null> {
  const db = useDb()
  const account = db.select().from(googleAccounts).limit(1).all()[0]
  if (!account) return null

  if (Date.now() > account.tokenExpiry - TOKEN_REFRESH_BUFFER_MS) {
    const config = useRuntimeConfig()
    try {
      const resp = await $fetch<{ access_token?: string; expires_in?: number }>(
        'https://oauth2.googleapis.com/token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: account.refreshToken,
            client_id: config.googleClientId,
            client_secret: config.googleClientSecret,
          }).toString(),
        },
      )
      if (!resp.access_token || !resp.expires_in) return null
      const newExpiry = Date.now() + resp.expires_in * 1000
      db.update(googleAccounts)
        .set({ accessToken: resp.access_token, tokenExpiry: newExpiry })
        .where(eq(googleAccounts.id, account.id))
        .run()
      return { token: resp.access_token, accountId: account.id }
    } catch {
      return null
    }
  }

  return { token: account.accessToken, accountId: account.id }
}

export async function ensureMeridianCalendar(token: string, accountId: string): Promise<string> {
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

export function toGoogleEventBody(e: CalendarEvent) {
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

export async function pushMeridianEventsToGoogle(token: string, accountId: string): Promise<number> {
  const calId = await ensureMeridianCalendar(token, accountId)
  const db = useDb()

  const unpushed = db.select().from(events)
    .where(isNull(events.googleEventId))
    .all()
    .filter(e => e.source === 'meridian')

  let pushed = 0
  for (const e of unpushed) {
    const eventBody = toGoogleEventBody({
      ...e,
      allDay: e.allDay === 1,
      desc: e.desc ?? undefined,
      location: e.location ?? undefined,
      source: 'meridian',
    })
    try {
      const created = await callGoogleApi<{ id: string }>(
        'POST',
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`,
        token,
        eventBody,
      )
      db.update(events)
        .set({ googleEventId: created.id, googleCalendarId: calId })
        .where(eq(events.id, e.id))
        .run()
      pushed++
    } catch {}
  }

  return pushed
}

export async function callGoogleApi<T>(
  method: string,
  url: string,
  token: string,
  body?: unknown,
): Promise<T> {
  const response = await globalThis.fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  if (!response.ok) {
    throw createError({ statusCode: response.status, message: `Google API error ${response.status}` })
  }
  return JSON.parse(text) as T
}
