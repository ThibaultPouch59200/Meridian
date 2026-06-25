import { getValidAccessToken, callGoogleApi } from '../../../utils/google'

export default defineEventHandler(async (event) => {
  const googleEventId = getRouterParam(event, 'googleEventId')!
  const { calendarId } = getQuery(event)
  if (!calendarId || typeof calendarId !== 'string') {
    return { ok: true }
  }

  const tokenData = await getValidAccessToken()
  if (!tokenData) return { ok: true }

  try {
    await callGoogleApi(
      'DELETE',
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
      tokenData.token,
    )
  } catch {}

  return { ok: true }
})
