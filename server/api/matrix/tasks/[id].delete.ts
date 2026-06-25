import { useDb } from '../../../../db'
import { tasks } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const db = useDb()
  db.delete(tasks).where(eq(tasks.id, id)).run()
  return { ok: true }
})
