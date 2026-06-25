import { useDb } from '../../../db'
import { tasks } from '../../../db/schema'
import { eq, max } from 'drizzle-orm'
import type { QuadrantId, Task } from '~~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ quadrant: QuadrantId; text: string }>(event)
  const db = useDb()

  const result = db.select({ maxPos: max(tasks.position) })
    .from(tasks)
    .where(eq(tasks.quadrant, body.quadrant))
    .get()
  const nextPosition = (result?.maxPos ?? -1) + 1

  const id = Date.now().toString()
  db.insert(tasks).values({
    id,
    quadrant: body.quadrant,
    text: body.text,
    done: 0,
    position: nextPosition,
  }).run()

  return { id, text: body.text, done: false } satisfies Task
})
