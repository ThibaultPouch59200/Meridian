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
  source: text('source').notNull().default('meridian'),
  googleEventId: text('googleEventId'),
  googleCalendarId: text('googleCalendarId'),
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

export const googleAccounts = sqliteTable('google_accounts', {
  id: text('id').primaryKey(),
  googleEmail: text('googleEmail').notNull(),
  accessToken: text('accessToken').notNull(),
  refreshToken: text('refreshToken').notNull(),
  tokenExpiry: integer('tokenExpiry').notNull(),
  meridianCalendarId: text('meridianCalendarId'),
  createdAt: integer('createdAt').notNull(),
})

export const googleCalendars = sqliteTable('google_calendars', {
  id: text('id').primaryKey(),
  googleAccountId: text('googleAccountId').notNull().references(() => googleAccounts.id),
  name: text('name').notNull(),
  color: text('color').notNull(),
  selected: integer('selected').notNull().default(0),
})
