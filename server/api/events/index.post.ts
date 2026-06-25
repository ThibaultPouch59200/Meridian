import { useDb } from '../../db'
import { events } from '../../db/schema'
import type { CalendarEvent } from '~~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<Omit<CalendarEvent, 'id'>>(event)
  const id = Date.now().toString()
  const db = useDb()
  db.insert(events).values({
    id,
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
  }).run()
  return { ...body, id, allDay: body.allDay || undefined }
})
