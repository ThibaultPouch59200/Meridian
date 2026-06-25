import { getValidAccessToken, callGoogleApi } from '../../../utils/google'
import type { CalendarEvent } from '~~/types'

export default defineEventHandler(async (event) => {
  const googleEventId = getRouterParam(event, 'googleEventId')!
  const body = await readBody<CalendarEvent>(event)
  const tokenData = await getValidAccessToken()
  if (!tokenData) throw createError({ statusCode: 401, message: 'No Google account linked' })

  const calId = body.googleCalendarId
  if (!calId) throw createError({ statusCode: 400, message: 'Missing googleCalendarId' })

  const payload = body.allDay
    ? {
        summary: body.name,
        description: body.desc,
        location: body.location,
        start: { date: body.startDate },
        end: { date: body.endDate },
      }
    : {
        summary: body.name,
        description: body.desc,
        location: body.location,
        start: { dateTime: `${body.startDate}T${body.startTime}:00` },
        end: { dateTime: `${body.endDate}T${body.endTime}:00` },
      }

  await callGoogleApi(
    'PATCH',
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${googleEventId}`,
    tokenData.token,
    payload,
  )

  return { ok: true }
})
