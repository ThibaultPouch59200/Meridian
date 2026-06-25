import { useDb } from '../../db'
import { matrixNotes } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(() => {
  const db = useDb()
  const row = db.select().from(matrixNotes).where(eq(matrixNotes.id, 1)).get()
  return { content: row?.content ?? '' }
})
