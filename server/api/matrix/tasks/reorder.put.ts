import { useDb } from '../../../db'
import { tasks } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { ids } = await readBody<{ quadrant: string; ids: string[] }>(event)
  const db = useDb()
  for (let i = 0; i < ids.length; i++) {
    db.update(tasks).set({ position: i }).where(eq(tasks.id, ids[i])).run()
  }
  return { ok: true }
})
