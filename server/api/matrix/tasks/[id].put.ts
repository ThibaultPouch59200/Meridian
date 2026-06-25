import { useDb } from '../../../../db'
import { tasks } from '../../../../db/schema'
import { eq } from 'drizzle-orm'
import type { Task } from '~~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody<Partial<Task>>(event)
  const db = useDb()
  db.update(tasks).set({
    ...(body.text !== undefined ? { text: body.text } : {}),
    ...(body.done !== undefined ? { done: body.done ? 1 : 0 } : {}),
  }).where(eq(tasks.id, id)).run()
  return { ok: true }
})
