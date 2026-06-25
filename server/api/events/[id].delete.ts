import { useDb } from '../../../db'
import { events } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const db = useDb()
  db.delete(events).where(eq(events.id, id)).run()
  return { ok: true }
})
