import { useDb } from '../../db'
import { events } from '../../db/schema'

export default defineEventHandler(() => {
  const db = useDb()
  const rows = db.select().from(events).all()
  return rows.map(r => ({ ...r, allDay: r.allDay === 1 || undefined }))
})
