import { useDb } from '../../db'
import { events } from '../../db/schema'
import { eq } from 'drizzle-orm'
import type { CalendarEvent } from '~~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody<CalendarEvent>(event)
  const db = useDb()
  db.update(events).set({
    name: body.name,
    desc: body.desc ?? null,
    startDate: body.startDate,
    startTime: body.startTime,
    endDate: body.endDate,
    endTime: body.endTime,
    location: body.location ?? null,
    color: body.color,
    tag: body.tag,
    allDay: body.allDay ? 1 : 0,
    // source, googleEventId, googleCalendarId intentionally NOT updated here
  }).where(eq(events.id, id)).run()
  return { ...body, allDay: body.allDay || undefined }
})
