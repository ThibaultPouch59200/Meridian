import { useDb } from '../../../db'
import { tasks } from '../../../db/schema'
import { asc } from 'drizzle-orm'
import type { QuadrantId, Task } from '~~/types'

const QUADRANTS: QuadrantId[] = ['inu', 'iu', 'ninu', 'niu', 'today', 'tomorrow']

export default defineEventHandler(() => {
  const db = useDb()
  const rows = db.select().from(tasks).orderBy(asc(tasks.position)).all()
  const grouped: Record<QuadrantId, Task[]> = {
    inu: [], iu: [], ninu: [], niu: [], today: [], tomorrow: [],
  }
  for (const row of rows) {
    if (QUADRANTS.includes(row.quadrant as QuadrantId)) {
      grouped[row.quadrant as QuadrantId].push({
        id: row.id,
        text: row.text,
        done: row.done === 1,
      })
    }
  }
  return grouped
})
