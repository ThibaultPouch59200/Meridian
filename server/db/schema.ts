import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  desc: text('desc'),
  startDate: text('startDate').notNull(),
  startTime: text('startTime').notNull(),
  endDate: text('endDate').notNull(),
  endTime: text('endTime').notNull(),
  location: text('location'),
  color: text('color').notNull(),
  tag: text('tag').notNull(),
  allDay: integer('allDay').notNull().default(0),
})

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  quadrant: text('quadrant').notNull(),
  text: text('text').notNull(),
  done: integer('done').notNull().default(0),
  position: integer('position').notNull().default(0),
})

export const matrixNotes = sqliteTable('matrix_notes', {
  id: integer('id').primaryKey(),
  content: text('content').notNull().default(''),
})
