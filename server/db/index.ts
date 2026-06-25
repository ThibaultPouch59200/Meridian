import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDb() {
  if (_db) return _db

  const url = process.env.NUXT_DATABASE_URL ?? './data/dev.db'
  mkdirSync(dirname(url), { recursive: true })

  const sqlite = new Database(url)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      desc TEXT,
      startDate TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endDate TEXT NOT NULL,
      endTime TEXT NOT NULL,
      location TEXT,
      color TEXT NOT NULL,
      tag TEXT NOT NULL,
      allDay INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      quadrant TEXT NOT NULL,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS matrix_notes (
      id INTEGER PRIMARY KEY NOT NULL,
      content TEXT NOT NULL DEFAULT ''
    );

    INSERT OR IGNORE INTO matrix_notes (id, content) VALUES (1, '');
  `)

  _db = drizzle(sqlite, { schema })
  return _db
}
