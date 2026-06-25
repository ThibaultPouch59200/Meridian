import { useDb } from '../../db'
import { matrixNotes } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { content } = await readBody<{ content: string }>(event)
  const db = useDb()
  db.update(matrixNotes).set({ content }).where(eq(matrixNotes.id, 1)).run()
  return { content }
})
