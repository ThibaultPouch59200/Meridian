import { useDb } from '../../../db'
import { googleCalendars } from '../../../db/schema'
import { getValidAccessToken, callGoogleApi } from '../../../utils/google'

interface GCalListEntry {
  id: string
  summary: string
  backgroundColor: string
}

export default defineEventHandler(async () => {
  console.log('[google/calendars] handler reached')
  const tokenData = await getValidAccessToken()
  console.log('[google/calendars] tokenData:', tokenData ? `accountId=${tokenData.accountId}` : 'null')
  if (!tokenData) throw createError({ statusCode: 401, message: 'No Google account linked' })

  let resp: { items: GCalListEntry[] }
  try {
    resp = await callGoogleApi<{ items: GCalListEntry[] }>(
      'GET',
      'https://www.googleapis.com/calendar/v3/calendarList',
      tokenData.token,
    )
    console.log('[google/calendars] Google API returned', resp.items?.length ?? 0, 'calendars')
  }
  catch (e) {
    console.error('[google/calendars] Google API error:', e)
    throw e
  }

  const db = useDb()
  const saved = db.select().from(googleCalendars).all()
  const savedMap = new Map(saved.map(c => [c.id, c]))

  return (resp.items ?? []).map(item => ({
    id: item.id,
    name: item.summary,
    googleColor: item.backgroundColor,
    color: savedMap.get(item.id)?.color ?? item.backgroundColor,
    selected: savedMap.get(item.id)?.selected ?? 0,
    googleAccountId: tokenData.accountId,
  }))
})
