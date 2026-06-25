# Google Calendar Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Google Calendar bidirectionally into Meridian: import selected Google calendars at app load, show events in the timeline with source badges, and push Meridian-created events to a "Meridian" Google Calendar.

**Architecture:** Google OAuth tokens stored in SQLite (`google_accounts`). Selected calendars tracked in `google_calendars`. Events table gains `source`, `googleEventId`, `googleCalendarId` columns. A `useGoogleStore` Pinia store drives sync, and a `/settings` page manages the connection.

**Tech Stack:** Nuxt 4 / Nitro server routes, Drizzle ORM + better-sqlite3, Pinia, raw `$fetch` to Google Calendar REST API v3, Tailwind CSS.

---

## File Map

**Create:**
- `server/utils/google.ts` — token refresh + Google API fetch helper
- `server/api/auth/google/redirect.get.ts` — OAuth redirect
- `server/api/auth/google/callback.get.ts` — OAuth callback, stores tokens
- `server/api/auth/google/disconnect.post.ts` — revoke + delete account
- `server/api/google/status.get.ts` — returns linked account + calendars
- `server/api/google/calendars.get.ts` — list Google calendars with selection state
- `server/api/google/calendars/select.post.ts` — save selected calendars
- `server/api/google/calendars/[id]/color.patch.ts` — override calendar color
- `server/api/google/sync.post.ts` — upsert Google events into local DB
- `server/api/google/events/index.post.ts` — push new Meridian event to Google
- `server/api/google/events/[googleEventId].patch.ts` — update Google event
- `server/api/google/events/[googleEventId].delete.ts` — delete Google event
- `app/stores/google.ts` — Pinia store for Google state
- `app/pages/settings.vue` — settings page
- `app/components/layout/IconSettings.vue` — gear SVG icon

**Modify:**
- `types/index.ts` — add `source`, `googleEventId`, `googleCalendarId` to `CalendarEvent`
- `server/db/schema.ts` — add `google_accounts`, `google_calendars` tables; add columns to `events`
- `server/db/index.ts` — `ALTER TABLE` for new event columns + `CREATE TABLE IF NOT EXISTS` for new tables
- `server/api/events/index.post.ts` — set `source='meridian'`, return new fields
- `server/api/events/[id].put.ts` — preserve `source`/`googleEventId`/`googleCalendarId` on update
- `app/stores/events.ts` — write-back to Google in `addEvent`, `updateEvent`, `deleteEvent`
- `app/components/layout/AppSidebar.vue` — add ⚙ link at bottom
- `app/layouts/default.vue` — `onMounted` sync
- `app/components/ui/EventModal.vue` — source badge, locked color, passthrough Google fields
- `app/components/timeline/EventBar.vue` — source badge before name
- `app/pages/timeline.vue` — preserve Google fields in `saveEvent`; source badge on all-day band
- `nuxt.config.ts` — add `googleClientId`, `googleClientSecret`, `googleRedirectUri` to runtimeConfig
- `.env.example` — add new env vars

---

## Task 1: Types, DB schema, and config

**Files:**
- Modify: `types/index.ts`
- Modify: `server/db/schema.ts`
- Modify: `server/db/index.ts`
- Modify: `nuxt.config.ts`
- Modify: `.env.example`

- [ ] **Step 1.1: Update `types/index.ts`**

Replace the `CalendarEvent` interface:

```ts
export interface CalendarEvent {
  id: string
  name: string
  desc?: string
  allDay?: boolean
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  location?: string
  color: string
  tag: string
  source: 'meridian' | 'google'
  googleEventId?: string
  googleCalendarId?: string
}

export interface Task {
  id: string
  text: string
  done: boolean
}

export interface Tag {
  label: string
  builtIn: boolean
}

export type QuadrantId = 'inu' | 'iu' | 'ninu' | 'niu' | 'today' | 'tomorrow'
```

- [ ] **Step 1.2: Update `server/db/schema.ts`**

Replace the entire file:

```ts
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
  googleAccountId: text('googleAccountId').notNull(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  selected: integer('selected').notNull().default(0),
})
```

- [ ] **Step 1.3: Update `server/db/index.ts`**

Add `ALTER TABLE` statements for the three new events columns (wrapped in try/catch because SQLite errors if the column already exists), and add `CREATE TABLE IF NOT EXISTS` for the two new tables. Replace the entire `sqlite.exec(...)` call:

```ts
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
      allDay INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'meridian',
      googleEventId TEXT,
      googleCalendarId TEXT
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

    CREATE TABLE IF NOT EXISTS google_accounts (
      id TEXT PRIMARY KEY NOT NULL,
      googleEmail TEXT NOT NULL,
      accessToken TEXT NOT NULL,
      refreshToken TEXT NOT NULL,
      tokenExpiry INTEGER NOT NULL,
      meridianCalendarId TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS google_calendars (
      id TEXT PRIMARY KEY NOT NULL,
      googleAccountId TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      selected INTEGER NOT NULL DEFAULT 0
    );

    INSERT OR IGNORE INTO matrix_notes (id, content) VALUES (1, '');
  `)

  // Migrate existing events table if columns are missing
  try { sqlite.exec(`ALTER TABLE events ADD COLUMN source TEXT NOT NULL DEFAULT 'meridian'`) } catch {}
  try { sqlite.exec(`ALTER TABLE events ADD COLUMN googleEventId TEXT`) } catch {}
  try { sqlite.exec(`ALTER TABLE events ADD COLUMN googleCalendarId TEXT`) } catch {}

  _db = drizzle(sqlite, { schema })
  return _db
}
```

- [ ] **Step 1.4: Update `nuxt.config.ts` runtimeConfig**

Add three new server-only keys:

```ts
runtimeConfig: {
  databaseUrl: '',
  googleClientId: '',
  googleClientSecret: '',
  googleRedirectUri: '',
  public: {
    appPassword: '',
  },
},
```

- [ ] **Step 1.5: Update `.env.example`**

Add at the end of the file:

```env
NUXT_GOOGLE_CLIENT_ID=
NUXT_GOOGLE_CLIENT_SECRET=
NUXT_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

- [ ] **Step 1.6: Verify the server starts**

Run: `npm run dev`

Expected: no TypeScript errors in the terminal, app loads at `http://localhost:3000`.

- [ ] **Step 1.7: Commit**

```bash
git add types/index.ts server/db/schema.ts server/db/index.ts nuxt.config.ts .env.example
git commit -m "feat(google): add DB schema for Google Calendar integration"
```

---

## Task 2: Google API utility

**Files:**
- Create: `server/utils/google.ts`

- [ ] **Step 2.1: Create `server/utils/google.ts`**

```ts
import { useDb } from '../db'
import { googleAccounts } from '../db/schema'
import { eq } from 'drizzle-orm'

export async function getValidAccessToken(): Promise<{ token: string; accountId: string } | null> {
  const db = useDb()
  const account = db.select().from(googleAccounts).limit(1).all()[0]
  if (!account) return null

  if (Date.now() > account.tokenExpiry - 60_000) {
    const config = useRuntimeConfig()
    const resp = await $fetch<{ access_token: string; expires_in: number }>(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: account.refreshToken,
          client_id: config.googleClientId,
          client_secret: config.googleClientSecret,
        }).toString(),
      },
    )
    const newExpiry = Date.now() + resp.expires_in * 1000
    db.update(googleAccounts)
      .set({ accessToken: resp.access_token, tokenExpiry: newExpiry })
      .where(eq(googleAccounts.id, account.id))
      .run()
    return { token: resp.access_token, accountId: account.id }
  }

  return { token: account.accessToken, accountId: account.id }
}

export async function callGoogleApi<T>(
  method: string,
  url: string,
  token: string,
  body?: unknown,
): Promise<T> {
  return $fetch<T>(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}
```

- [ ] **Step 2.2: Verify TypeScript**

Run: `npm run dev`

Expected: no errors mentioning `server/utils/google.ts`.

- [ ] **Step 2.3: Commit**

```bash
git add server/utils/google.ts
git commit -m "feat(google): add Google API utility with token refresh"
```

---

## Task 3: OAuth redirect and callback

**Files:**
- Create: `server/api/auth/google/redirect.get.ts`
- Create: `server/api/auth/google/callback.get.ts`

- [ ] **Step 3.1: Create `server/api/auth/google/redirect.get.ts`**

```ts
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: config.googleRedirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar',
      'email',
      'profile',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
  })
  return sendRedirect(event, `https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})
```

- [ ] **Step 3.2: Create `server/api/auth/google/callback.get.ts`**

```ts
import { useDb } from '../../../db'
import { googleAccounts, googleCalendars, events } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { code } = getQuery(event)
  if (!code || typeof code !== 'string') {
    throw createError({ statusCode: 400, message: 'Missing OAuth code' })
  }

  const config = useRuntimeConfig()

  const tokens = await $fetch<{
    access_token: string
    refresh_token: string
    expires_in: number
  }>('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: config.googleRedirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  })

  const userInfo = await $fetch<{ email: string }>(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } },
  )

  const db = useDb()
  // Remove existing account (single-account mode)
  const existing = db.select({ id: googleAccounts.id }).from(googleAccounts).limit(1).all()[0]
  if (existing) {
    db.delete(googleCalendars).where(eq(googleCalendars.googleAccountId, existing.id)).run()
    db.delete(events).where(eq(events.source, 'google')).run()
    db.delete(googleAccounts).where(eq(googleAccounts.id, existing.id)).run()
  }

  db.insert(googleAccounts).values({
    id: Date.now().toString(),
    googleEmail: userInfo.email,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiry: Date.now() + tokens.expires_in * 1000,
    meridianCalendarId: null,
    createdAt: Date.now(),
  }).run()

  return sendRedirect(event, '/settings?step=calendars')
})
```

- [ ] **Step 3.3: Verify routes exist**

Run: `npm run dev`, then in browser go to `http://localhost:3000/api/auth/google/redirect` (without env vars configured).

Expected: browser redirects to Google OAuth page (or shows an error about missing `client_id` if env vars are empty — either is correct at this stage).

- [ ] **Step 3.4: Commit**

```bash
git add server/api/auth/google/redirect.get.ts server/api/auth/google/callback.get.ts
git commit -m "feat(google): add OAuth redirect and callback routes"
```

---

## Task 4: OAuth disconnect

**Files:**
- Create: `server/api/auth/google/disconnect.post.ts`

- [ ] **Step 4.1: Create `server/api/auth/google/disconnect.post.ts`**

```ts
import { useDb } from '../../../db'
import { googleAccounts, googleCalendars, events } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { getValidAccessToken } from '../../../utils/google'

export default defineEventHandler(async () => {
  const tokenData = await getValidAccessToken()

  if (tokenData) {
    try {
      await $fetch(
        `https://oauth2.googleapis.com/revoke?token=${tokenData.token}`,
        { method: 'POST' },
      )
    } catch {}
  }

  const db = useDb()
  const account = db.select({ id: googleAccounts.id }).from(googleAccounts).limit(1).all()[0]
  if (account) {
    db.delete(events).where(eq(events.source, 'google')).run()
    db.delete(googleCalendars).where(eq(googleCalendars.googleAccountId, account.id)).run()
    db.delete(googleAccounts).where(eq(googleAccounts.id, account.id)).run()
  }

  return { ok: true }
})
```

- [ ] **Step 4.2: Commit**

```bash
git add server/api/auth/google/disconnect.post.ts
git commit -m "feat(google): add OAuth disconnect route"
```

---

## Task 5: Google status and calendar selection APIs

**Files:**
- Create: `server/api/google/status.get.ts`
- Create: `server/api/google/calendars.get.ts`
- Create: `server/api/google/calendars/select.post.ts`
- Create: `server/api/google/calendars/[id]/color.patch.ts`

- [ ] **Step 5.1: Create `server/api/google/status.get.ts`**

```ts
import { useDb } from '../../db'
import { googleAccounts, googleCalendars } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(() => {
  const db = useDb()
  const account = db.select().from(googleAccounts).limit(1).all()[0] ?? null
  const calendars = account
    ? db.select().from(googleCalendars)
        .where(eq(googleCalendars.googleAccountId, account.id))
        .all()
    : []

  return {
    account: account
      ? {
          id: account.id,
          googleEmail: account.googleEmail,
          meridianCalendarId: account.meridianCalendarId,
          createdAt: account.createdAt,
        }
      : null,
    calendars,
  }
})
```

- [ ] **Step 5.2: Create `server/api/google/calendars.get.ts`**

Returns all Google calendars from the API, annotated with local selection state:

```ts
import { useDb } from '../../db'
import { googleCalendars } from '../../db/schema'
import { getValidAccessToken, callGoogleApi } from '../../utils/google'

interface GCalListEntry {
  id: string
  summary: string
  backgroundColor: string
}

export default defineEventHandler(async () => {
  const tokenData = await getValidAccessToken()
  if (!tokenData) throw createError({ statusCode: 401, message: 'No Google account linked' })

  const resp = await callGoogleApi<{ items: GCalListEntry[] }>(
    'GET',
    'https://www.googleapis.com/calendar/v3/calendarList',
    tokenData.token,
  )

  const db = useDb()
  const saved = db.select().from(googleCalendars).all()
  const savedMap = new Map(saved.map(c => [c.id, c]))

  return (resp.items ?? []).map(item => ({
    id: item.id,
    name: item.summary,
    googleColor: item.backgroundColor,
    color: savedMap.get(item.id)?.color ?? item.backgroundColor,
    selected: savedMap.get(item.id)?.selected ?? 0,
    googleAccountId: tokenData.accountId,
  }))
})
```

- [ ] **Step 5.3: Create `server/api/google/calendars/select.post.ts`**

```ts
import { useDb } from '../../../db'
import { googleCalendars } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { getValidAccessToken } from '../../../utils/google'

interface CalendarEntry {
  id: string
  name: string
  color: string
  selected: boolean
}

export default defineEventHandler(async (event) => {
  const tokenData = await getValidAccessToken()
  if (!tokenData) throw createError({ statusCode: 401, message: 'No Google account linked' })

  const { calendars } = await readBody<{ calendars: CalendarEntry[] }>(event)
  const db = useDb()

  for (const cal of calendars) {
    const existing = db.select().from(googleCalendars)
      .where(eq(googleCalendars.id, cal.id))
      .all()[0]

    if (existing) {
      db.update(googleCalendars)
        .set({ selected: cal.selected ? 1 : 0, name: cal.name, color: cal.color })
        .where(eq(googleCalendars.id, cal.id))
        .run()
    }
    else {
      db.insert(googleCalendars).values({
        id: cal.id,
        googleAccountId: tokenData.accountId,
        name: cal.name,
        color: cal.color,
        selected: cal.selected ? 1 : 0,
      }).run()
    }
  }

  return { ok: true }
})
```

- [ ] **Step 5.4: Create `server/api/google/calendars/[id]/color.patch.ts`**

When the user overrides a calendar's color in Settings, this updates `google_calendars.color` and bulk-updates all events from that calendar so the color is immediately consistent:

```ts
import { useDb } from '../../../../../db'
import { googleCalendars, events } from '../../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const calId = getRouterParam(event, 'id')!
  const { color } = await readBody<{ color: string }>(event)
  const db = useDb()

  db.update(googleCalendars).set({ color }).where(eq(googleCalendars.id, calId)).run()
  db.update(events).set({ color }).where(eq(events.googleCalendarId, calId)).run()

  return { ok: true }
})
```

- [ ] **Step 5.5: Verify status endpoint**

Run: `npm run dev`, then: `curl http://localhost:3000/api/google/status`

Expected:
```json
{"account":null,"calendars":[]}
```

- [ ] **Step 5.6: Commit**

```bash
git add server/api/google/status.get.ts server/api/google/calendars.get.ts server/api/google/calendars/select.post.ts server/api/google/calendars/[id]/color.patch.ts
git commit -m "feat(google): add calendar status, list, select, and color APIs"
```

---

## Task 6: Sync API

**Files:**
- Create: `server/api/google/sync.post.ts`

- [ ] **Step 6.1: Create `server/api/google/sync.post.ts`**

```ts
import { useDb } from '../../db'
import { events, googleCalendars } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { getValidAccessToken, callGoogleApi } from '../../utils/google'

interface GEvent {
  id: string
  summary?: string
  description?: string
  location?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  status: string
}

function parseGoogleEvent(g: GEvent, calId: string, calColor: string) {
  const allDay = !g.start.dateTime
  const startDate = allDay ? (g.start.date ?? '') : (g.start.dateTime ?? '').slice(0, 10)
  const startTime = allDay ? '00:00' : (g.start.dateTime ?? '').slice(11, 16)
  const endDate = allDay ? (g.end.date ?? '') : (g.end.dateTime ?? '').slice(0, 10)
  const endTime = allDay ? '23:59' : (g.end.dateTime ?? '').slice(11, 16)
  return {
    id: `gcal_${g.id}`,
    name: g.summary ?? '(sans titre)',
    desc: g.description ?? null,
    allDay: allDay ? 1 : 0,
    startDate,
    startTime,
    endDate,
    endTime,
    location: g.location ?? null,
    color: calColor,
    tag: '',
    source: 'google' as const,
    googleEventId: g.id,
    googleCalendarId: calId,
  }
}

export default defineEventHandler(async () => {
  const tokenData = await getValidAccessToken()
  if (!tokenData) return { ok: true, synced: 0 }

  const db = useDb()
  const cals = db.select().from(googleCalendars)
    .where(eq(googleCalendars.selected, 1))
    .all()

  if (cals.length === 0) return { ok: true, synced: 0 }

  const now = new Date()
  const minTime = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()
  const maxTime = new Date(now.getTime() + 90 * 24 * 3600 * 1000).toISOString()

  const seenGoogleIds = new Set<string>()
  let synced = 0

  for (const cal of cals) {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?timeMin=${minTime}&timeMax=${maxTime}&singleEvents=true&maxResults=2500`
    let resp: { items?: GEvent[] }
    try {
      resp = await callGoogleApi<{ items?: GEvent[] }>('GET', url, tokenData.token)
    } catch {
      continue
    }

    for (const g of (resp.items ?? [])) {
      if (g.status === 'cancelled') continue
      const parsed = parseGoogleEvent(g, cal.id, cal.color)
      seenGoogleIds.add(g.id)

      const existing = db.select({ id: events.id })
        .from(events)
        .where(eq(events.googleEventId, g.id))
        .all()[0]

      if (existing) {
        db.update(events).set({
          name: parsed.name,
          desc: parsed.desc,
          startDate: parsed.startDate,
          startTime: parsed.startTime,
          endDate: parsed.endDate,
          endTime: parsed.endTime,
          location: parsed.location,
          color: parsed.color,
          allDay: parsed.allDay,
          googleCalendarId: cal.id,
        }).where(eq(events.id, existing.id)).run()
      }
      else {
        db.insert(events).values(parsed).run()
      }
      synced++
    }
  }

  // Remove Google events that no longer exist in Google's response
  const allGoogleEvents = db.select({ id: events.id, googleEventId: events.googleEventId })
    .from(events)
    .where(eq(events.source, 'google'))
    .all()

  for (const e of allGoogleEvents) {
    if (e.googleEventId && !seenGoogleIds.has(e.googleEventId)) {
      db.delete(events).where(eq(events.id, e.id)).run()
    }
  }

  return { ok: true, synced }
})
```

- [ ] **Step 6.2: Commit**

```bash
git add server/api/google/sync.post.ts
git commit -m "feat(google): add Google Calendar sync API"
```

---

## Task 7: Google events write-back API

**Files:**
- Create: `server/api/google/events/index.post.ts`
- Create: `server/api/google/events/[googleEventId].patch.ts`
- Create: `server/api/google/events/[googleEventId].delete.ts`

- [ ] **Step 7.1: Create `server/api/google/events/index.post.ts`**

Called after a new Meridian event is saved locally. Pushes it to the "Meridian" Google Calendar and updates the local event with the returned `googleEventId`:

```ts
import { useDb } from '../../../db'
import { googleAccounts, events } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { getValidAccessToken, callGoogleApi } from '../../../utils/google'
import type { CalendarEvent } from '~~/types'

async function ensureMeridianCalendar(token: string, accountId: string): Promise<string> {
  const db = useDb()
  const account = db.select().from(googleAccounts).where(eq(googleAccounts.id, accountId)).all()[0]
  if (!account) throw createError({ statusCode: 500, message: 'Account not found' })

  if (account.meridianCalendarId) return account.meridianCalendarId

  const list = await callGoogleApi<{ items: { id: string; summary: string }[] }>(
    'GET',
    'https://www.googleapis.com/calendar/v3/calendarList',
    token,
  )
  const existing = (list.items ?? []).find(c => c.summary === 'Meridian')
  if (existing) {
    db.update(googleAccounts).set({ meridianCalendarId: existing.id })
      .where(eq(googleAccounts.id, accountId)).run()
    return existing.id
  }

  const created = await callGoogleApi<{ id: string }>(
    'POST',
    'https://www.googleapis.com/calendar/v3/calendars',
    token,
    { summary: 'Meridian' },
  )
  db.update(googleAccounts).set({ meridianCalendarId: created.id })
    .where(eq(googleAccounts.id, accountId)).run()
  return created.id
}

function toGoogleEventBody(e: CalendarEvent) {
  if (e.allDay) {
    return {
      summary: e.name,
      description: e.desc,
      location: e.location,
      start: { date: e.startDate },
      end: { date: e.endDate },
    }
  }
  return {
    summary: e.name,
    description: e.desc,
    location: e.location,
    start: { dateTime: `${e.startDate}T${e.startTime}:00` },
    end: { dateTime: `${e.endDate}T${e.endTime}:00` },
  }
}

export default defineEventHandler(async (event) => {
  const tokenData = await getValidAccessToken()
  if (!tokenData) throw createError({ statusCode: 401, message: 'No Google account linked' })

  const body = await readBody<CalendarEvent>(event)
  const calId = await ensureMeridianCalendar(tokenData.token, tokenData.accountId)

  const created = await callGoogleApi<{ id: string }>(
    'POST',
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`,
    tokenData.token,
    toGoogleEventBody(body),
  )

  const db = useDb()
  db.update(events)
    .set({ googleEventId: created.id, googleCalendarId: calId })
    .where(eq(events.id, body.id))
    .run()

  return { googleEventId: created.id, googleCalendarId: calId }
})
```

- [ ] **Step 7.2: Create `server/api/google/events/[googleEventId].patch.ts`**

```ts
import { getValidAccessToken, callGoogleApi } from '../../../utils/google'
import type { CalendarEvent } from '~~/types'

export default defineEventHandler(async (event) => {
  const googleEventId = getRouterParam(event, 'googleEventId')!
  const body = await readBody<CalendarEvent>(event)
  const tokenData = await getValidAccessToken()
  if (!tokenData) throw createError({ statusCode: 401, message: 'No Google account linked' })

  const calId = body.googleCalendarId
  if (!calId) throw createError({ statusCode: 400, message: 'Missing googleCalendarId' })

  const payload = body.allDay
    ? {
        summary: body.name,
        description: body.desc,
        location: body.location,
        start: { date: body.startDate },
        end: { date: body.endDate },
      }
    : {
        summary: body.name,
        description: body.desc,
        location: body.location,
        start: { dateTime: `${body.startDate}T${body.startTime}:00` },
        end: { dateTime: `${body.endDate}T${body.endTime}:00` },
      }

  await callGoogleApi(
    'PATCH',
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${googleEventId}`,
    tokenData.token,
    payload,
  )

  return { ok: true }
})
```

- [ ] **Step 7.3: Create `server/api/google/events/[googleEventId].delete.ts`**

```ts
import { getValidAccessToken, callGoogleApi } from '../../../utils/google'

export default defineEventHandler(async (event) => {
  const googleEventId = getRouterParam(event, 'googleEventId')!
  const { calendarId } = getQuery(event)
  if (!calendarId || typeof calendarId !== 'string') {
    return { ok: true }
  }

  const tokenData = await getValidAccessToken()
  if (!tokenData) return { ok: true }

  try {
    await callGoogleApi(
      'DELETE',
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
      tokenData.token,
    )
  } catch {}

  return { ok: true }
})
```

- [ ] **Step 7.4: Commit**

```bash
git add server/api/google/events/index.post.ts server/api/google/events/[googleEventId].patch.ts server/api/google/events/[googleEventId].delete.ts
git commit -m "feat(google): add Google events write-back API routes"
```

---

## Task 8: Update local events API + events store

**Files:**
- Modify: `server/api/events/index.post.ts`
- Modify: `server/api/events/[id].put.ts`
- Modify: `app/stores/events.ts`

- [ ] **Step 8.1: Update `server/api/events/index.post.ts`**

Set `source='meridian'` and include new fields in the insert. Replace the entire file:

```ts
import { useDb } from '../../db'
import { events } from '../../db/schema'
import type { CalendarEvent } from '~~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<Omit<CalendarEvent, 'id'>>(event)
  const id = Date.now().toString()
  const db = useDb()
  db.insert(events).values({
    id,
    name: body.name,
    desc: body.desc ?? null,
    startDate: body.startDate,
    startTime: body.startTime,
    endDate: body.endDate,
    endTime: body.endTime,
    location: body.location ?? null,
    color: body.color,
    tag: body.tag,
    allDay: body.allDay ? 1 : 0,
    source: 'meridian',
    googleEventId: null,
    googleCalendarId: null,
  }).run()
  return {
    ...body,
    id,
    source: 'meridian' as const,
    allDay: body.allDay || undefined,
    googleEventId: undefined,
    googleCalendarId: undefined,
  }
})
```

- [ ] **Step 8.2: Update `server/api/events/[id].put.ts`**

Preserve `source`, `googleEventId`, `googleCalendarId` — read the existing event first, then only update the user-editable fields. Replace the entire file:

```ts
import { useDb } from '../../db'
import { events } from '../../db/schema'
import { eq } from 'drizzle-orm'
import type { CalendarEvent } from '~~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody<CalendarEvent>(event)
  const db = useDb()
  db.update(events).set({
    name: body.name,
    desc: body.desc ?? null,
    startDate: body.startDate,
    startTime: body.startTime,
    endDate: body.endDate,
    endTime: body.endTime,
    location: body.location ?? null,
    color: body.color,
    tag: body.tag,
    allDay: body.allDay ? 1 : 0,
    // source, googleEventId, googleCalendarId are intentionally NOT updated here
    // They are set at creation and managed by the Google sync routes
  }).where(eq(events.id, id)).run()
  return { ...body, allDay: body.allDay || undefined }
})
```

- [ ] **Step 8.3: Update `app/stores/events.ts`**

Add write-back to Google in `addEvent`, `updateEvent`, and `deleteEvent`. Replace the entire file:

```ts
import { defineStore } from 'pinia'
import type { CalendarEvent } from '~~/types'

export const EVENT_COLORS = [
  '#4a90d9', '#e05555', '#3bb87a', '#f0a832',
  '#9b72d0', '#e08040', '#5ab8c4', '#888888',
]

export const EVENT_COLOR_BG: Record<string, string> = {
  '#4a90d9': 'rgba(74,144,217,0.12)',
  '#e05555': 'rgba(224,85,85,0.12)',
  '#3bb87a': 'rgba(59,184,122,0.12)',
  '#f0a832': 'rgba(240,168,50,0.12)',
  '#9b72d0': 'rgba(155,114,208,0.12)',
  '#e08040': 'rgba(224,128,64,0.12)',
  '#5ab8c4': 'rgba(90,184,196,0.12)',
  '#888888': 'rgba(136,136,136,0.12)',
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const useEventsStore = defineStore('events', {
  state: () => ({
    events: [] as CalendarEvent[],
    currentDate: todayKey(),
    timelineMode: 'day' as 'day' | 'month',
  }),
  getters: {
    dayEvents: (state): CalendarEvent[] =>
      state.events.filter(e =>
        !e.allDay && e.startDate === state.currentDate && e.endDate === state.currentDate,
      ),
    allDayEvents: (state): CalendarEvent[] =>
      state.events.filter(e =>
        (e.allDay === true || e.startDate !== e.endDate) &&
        e.startDate <= state.currentDate &&
        e.endDate >= state.currentDate,
      ),
    eventsForDate: (state) => (date: string): CalendarEvent[] =>
      state.events.filter(e =>
        e.allDay || e.startDate !== e.endDate
          ? e.startDate <= date && e.endDate >= date
          : e.startDate === date,
      ),
  },
  actions: {
    async fetch() {
      const rows = await $fetch<CalendarEvent[]>('/api/events')
      this.events = rows.map(r => ({ ...r, source: r.source ?? 'meridian' }))
    },
    async addEvent(event: Omit<CalendarEvent, 'id'>) {
      const created = await $fetch<CalendarEvent>('/api/events', {
        method: 'POST',
        body: event,
      })
      this.events.push(created)
      // Push to Google "Meridian" calendar if a Google account is linked
      try {
        const { useGoogleStore } = await import('./google')
        const googleStore = useGoogleStore()
        if (googleStore.isConnected) {
          await $fetch('/api/google/events', { method: 'POST', body: created })
          // Re-fetch to pick up googleEventId set by the route
          await this.fetch()
        }
      } catch {}
    },
    async updateEvent(updated: CalendarEvent) {
      const result = await $fetch<CalendarEvent>(`/api/events/${updated.id}`, {
        method: 'PUT',
        body: updated,
      })
      const idx = this.events.findIndex(e => e.id === result.id)
      if (idx !== -1) this.events[idx] = { ...result, source: result.source ?? 'meridian' }
      // Write-back to Google if the event has a googleEventId
      if (updated.googleEventId && updated.googleCalendarId) {
        try {
          await $fetch(`/api/google/events/${updated.googleEventId}`, {
            method: 'PATCH',
            body: updated,
          })
        } catch {}
      }
    },
    async deleteEvent(id: string) {
      const event = this.events.find(e => e.id === id)
      await $fetch(`/api/events/${id}`, { method: 'DELETE' })
      this.events = this.events.filter(e => e.id !== id)
      // Delete from Google if the event has a googleEventId
      if (event?.googleEventId && event.googleCalendarId) {
        try {
          await $fetch(
            `/api/google/events/${event.googleEventId}?calendarId=${encodeURIComponent(event.googleCalendarId)}`,
            { method: 'DELETE' },
          )
        } catch {}
      }
    },
    setCurrentDate(date: string) {
      this.currentDate = date
    },
    setTimelineMode(mode: 'day' | 'month') {
      this.timelineMode = mode
    },
  },
})
```

- [ ] **Step 8.4: Verify app loads**

Run: `npm run dev`

Expected: app loads, events display normally, no console errors.

- [ ] **Step 8.5: Commit**

```bash
git add server/api/events/index.post.ts server/api/events/[id].put.ts app/stores/events.ts
git commit -m "feat(google): update events API and store with Google write-back"
```

---

## Task 9: useGoogleStore

**Files:**
- Create: `app/stores/google.ts`

- [ ] **Step 9.1: Create `app/stores/google.ts`**

```ts
import { defineStore } from 'pinia'

interface GoogleAccount {
  id: string
  googleEmail: string
  meridianCalendarId: string | null
  createdAt: number
}

interface GoogleCalendar {
  id: string
  googleAccountId: string
  name: string
  color: string
  selected: number
}

export const useGoogleStore = defineStore('google', {
  state: () => ({
    account: null as GoogleAccount | null,
    calendars: [] as GoogleCalendar[],
    syncing: false,
    lastSyncedAt: null as number | null,
  }),
  getters: {
    isConnected: (state): boolean => !!state.account,
    selectedCalendars: (state): GoogleCalendar[] => state.calendars.filter(c => c.selected === 1),
  },
  actions: {
    async fetchStatus() {
      try {
        const data = await $fetch<{ account: GoogleAccount | null; calendars: GoogleCalendar[] }>(
          '/api/google/status',
        )
        this.account = data.account
        this.calendars = data.calendars
      }
      catch {
        this.account = null
        this.calendars = []
      }
    },
    async sync() {
      if (!this.account || this.syncing) return
      this.syncing = true
      try {
        await $fetch('/api/google/sync', { method: 'POST' })
        this.lastSyncedAt = Date.now()
      }
      catch {}
      finally {
        this.syncing = false
      }
    },
    async updateCalendarColor(calId: string, color: string) {
      await $fetch(`/api/google/calendars/${calId}/color`, { method: 'PATCH', body: { color } })
      const cal = this.calendars.find(c => c.id === calId)
      if (cal) cal.color = color
    },
    async saveCalendarSelection(
      calendars: Array<{ id: string; name: string; color: string; selected: boolean }>,
    ) {
      await $fetch('/api/google/calendars/select', { method: 'POST', body: { calendars } })
      await this.fetchStatus()
    },
    async disconnect() {
      await $fetch('/api/auth/google/disconnect', { method: 'POST' })
      this.account = null
      this.calendars = []
    },
  },
})
```

- [ ] **Step 9.2: Verify store is importable**

Run: `npm run dev`

Expected: no errors about `app/stores/google.ts`.

- [ ] **Step 9.3: Commit**

```bash
git add app/stores/google.ts
git commit -m "feat(google): add useGoogleStore Pinia store"
```

---

## Task 10: Sidebar settings icon + layout sync trigger

**Files:**
- Create: `app/components/layout/IconSettings.vue`
- Modify: `app/components/layout/AppSidebar.vue`
- Modify: `app/layouts/default.vue`

- [ ] **Step 10.1: Create `app/components/layout/IconSettings.vue`**

```vue
<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-5 h-5" style="stroke-width:1.5">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
</template>
```

- [ ] **Step 10.2: Update `app/components/layout/AppSidebar.vue`**

Add the ⚙ icon below the existing nav icons, separated by a spacer. Replace the entire file:

```vue
<template>
  <!-- Desktop: sidebar verticale gauche -->
  <nav class="hidden sm:flex w-[52px] h-screen flex-col items-center justify-center gap-[6px] flex-shrink-0 relative z-10">
    <div
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-[140px] bg-gray-200 pointer-events-none"
    />
    <IconButton title="Timeline" :active="route.path.startsWith('/timeline')" @click="navigateTo('/timeline')">
      <IconTimeline />
    </IconButton>
    <IconButton title="Matrice" :active="route.path.startsWith('/matrix')" @click="navigateTo('/matrix')">
      <IconMatrix />
    </IconButton>
    <!-- Settings icon pinned to bottom -->
    <div class="absolute bottom-4">
      <IconButton title="Settings" :active="route.path.startsWith('/settings')" @click="navigateTo('/settings')">
        <IconSettings />
      </IconButton>
    </div>
  </nav>

  <!-- Mobile: barre fixe en bas -->
  <nav class="sm:hidden fixed bottom-0 left-0 right-0 h-14 flex items-center justify-around bg-white border-t border-gray-200 z-50">
    <button
      :class="[
        'flex flex-col items-center gap-1 p-2 transition-colors',
        route.path.startsWith('/timeline') ? 'text-black' : 'text-gray-400',
      ]"
      @click="navigateTo('/timeline')"
    >
      <IconTimeline />
      <span class="text-[9px] font-semibold tracking-[0.5px] uppercase">Timeline</span>
    </button>
    <button
      :class="[
        'flex flex-col items-center gap-1 p-2 transition-colors',
        route.path.startsWith('/matrix') ? 'text-black' : 'text-gray-400',
      ]"
      @click="navigateTo('/matrix')"
    >
      <IconMatrix />
      <span class="text-[9px] font-semibold tracking-[0.5px] uppercase">Matrix</span>
    </button>
    <button
      :class="[
        'flex flex-col items-center gap-1 p-2 transition-colors',
        route.path.startsWith('/settings') ? 'text-black' : 'text-gray-400',
      ]"
      @click="navigateTo('/settings')"
    >
      <IconSettings />
      <span class="text-[9px] font-semibold tracking-[0.5px] uppercase">Settings</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
```

- [ ] **Step 10.3: Update `app/layouts/default.vue`**

Add `onMounted` sync. Replace the entire file:

```vue
<template>
  <div class="flex w-full h-screen overflow-hidden bg-gray-50">
    <AppSidebar />
    <div class="flex-1 min-w-0 sm:border-l border-gray-200 bg-white flex flex-col h-screen overflow-hidden pb-14 sm:pb-0">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEventsStore } from '~/stores/events'
import { useGoogleStore } from '~/stores/google'

const eventsStore = useEventsStore()
const googleStore = useGoogleStore()

onMounted(async () => {
  await googleStore.fetchStatus()
  if (googleStore.isConnected) {
    await googleStore.sync()
    await eventsStore.fetch()
  }
})
</script>
```

- [ ] **Step 10.4: Verify sidebar renders**

Run: `npm run dev`

Expected: ⚙ icon appears at the bottom of the sidebar on desktop; a "Settings" tab appears in the mobile bottom bar.

- [ ] **Step 10.5: Commit**

```bash
git add app/components/layout/IconSettings.vue app/components/layout/AppSidebar.vue app/layouts/default.vue
git commit -m "feat(google): add settings icon to sidebar and Google sync on mount"
```

---

## Task 11: Settings page

**Files:**
- Create: `app/pages/settings.vue`

- [ ] **Step 11.1: Create `app/pages/settings.vue`**

```vue
<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <header class="border-b border-gray-200 flex-shrink-0 px-4 sm:px-7 sm:pl-6 pt-[14px] pb-[14px]">
      <span class="font-display text-[20px] font-normal tracking-[-0.3px]">Settings</span>
    </header>

    <div class="flex-1 overflow-y-auto px-4 sm:px-7 sm:pl-6 py-6 max-w-[560px]">

      <!-- Google Calendar section -->
      <div class="mb-8">
        <p class="section-label mb-3">Google Calendar</p>

        <!-- Not connected -->
        <div v-if="!googleStore.isConnected">
          <div class="border border-gray-200 rounded-md p-4 flex items-center justify-between gap-4">
            <div>
              <p class="text-[13px] font-semibold text-black mb-[2px]">Connecter un compte Google</p>
              <p class="text-[11px] text-gray-400">Importe tes calendriers et synchronise tes événements</p>
            </div>
            <button class="btn-primary whitespace-nowrap flex-shrink-0" @click="connectGoogle">
              Connecter
            </button>
          </div>
        </div>

        <!-- Connected -->
        <div v-else>
          <!-- Account row -->
          <div class="border border-gray-200 rounded-md p-3 flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-[12px] font-bold text-blue-600 flex-shrink-0">
                {{ googleStore.account!.googleEmail[0]?.toUpperCase() }}
              </div>
              <div>
                <p class="text-[12px] font-semibold text-black">{{ googleStore.account!.googleEmail }}</p>
                <p class="text-[10px] text-gray-400">
                  {{ googleStore.lastSyncedAt ? `Dernière sync : ${timeSince(googleStore.lastSyncedAt)}` : 'Non synchronisé' }}
                </p>
              </div>
            </div>
            <button
              class="px-3 py-[5px] text-[10px] font-semibold border border-red-300 text-red-500 rounded-[3px] hover:bg-red-50 transition-all bg-transparent cursor-pointer"
              :disabled="disconnecting"
              @click="disconnect"
            >
              {{ disconnecting ? '…' : 'Déconnecter' }}
            </button>
          </div>

          <!-- Calendar selection step (right after OAuth) -->
          <div v-if="route.query.step === 'calendars'" class="mb-4">
            <p class="section-label mb-2">Sélectionne tes calendriers</p>
            <div v-if="loadingCals" class="text-[11px] text-gray-400 py-2">Chargement…</div>
            <div v-else class="flex flex-col gap-2">
              <label
                v-for="cal in availableCals"
                :key="cal.id"
                class="flex items-center gap-3 border border-gray-200 rounded-[5px] p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  v-model="cal.selected"
                  :true-value="1"
                  :false-value="0"
                  type="checkbox"
                  class="w-[13px] h-[13px] cursor-pointer accent-black flex-shrink-0"
                />
                <span
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  :style="{ background: cal.color }"
                />
                <span class="text-[12px] font-medium text-black flex-1">{{ cal.name }}</span>
              </label>
            </div>
            <button
              class="btn-primary mt-3 w-full"
              :disabled="savingCals"
              @click="saveCalendars"
            >
              {{ savingCals ? '…' : 'Confirmer' }}
            </button>
          </div>

          <!-- Calendars list (normal settings view) -->
          <div v-else>
            <p class="section-label mb-2">Calendriers</p>
            <div v-if="googleStore.calendars.length === 0" class="text-[11px] text-gray-400 py-2">
              Aucun calendrier sélectionné.
              <button class="underline cursor-pointer bg-transparent border-none text-gray-400" @click="goSelectCalendars">
                Modifier
              </button>
            </div>
            <div v-else class="flex flex-col gap-2">
              <div
                v-for="cal in googleStore.calendars"
                :key="cal.id"
                class="flex items-center justify-between border border-gray-200 rounded-[5px] p-3"
              >
                <div class="flex items-center gap-3">
                  <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ background: cal.color }" />
                  <span class="text-[12px] font-medium text-black">{{ cal.name }}</span>
                </div>
                <!-- Color override swatches -->
                <div class="flex gap-[5px] items-center">
                  <button
                    v-for="c in EVENT_COLORS"
                    :key="c"
                    class="w-[13px] h-[13px] rounded-full flex-shrink-0 cursor-pointer border-2 transition-all"
                    :style="{
                      background: c,
                      borderColor: cal.color === c ? '#0d0d0d' : 'transparent',
                    }"
                    :title="c"
                    @click="googleStore.updateCalendarColor(cal.id, c).then(() => eventsStore.fetch())"
                  />
                </div>
              </div>
              <button
                class="text-[10px] text-gray-400 underline text-left bg-transparent border-none cursor-pointer mt-1"
                @click="goSelectCalendars"
              >
                Modifier la sélection
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useGoogleStore } from '~/stores/google'
import { useEventsStore, EVENT_COLORS } from '~/stores/events'

const googleStore = useGoogleStore()
const eventsStore = useEventsStore()
const route = useRoute()
const router = useRouter()

const disconnecting = ref(false)
const loadingCals = ref(false)
const savingCals = ref(false)
const availableCals = ref<Array<{ id: string; name: string; color: string; selected: number }>>([])

onMounted(async () => {
  if (route.query.step === 'calendars') {
    loadingCals.value = true
    try {
      availableCals.value = await $fetch('/api/google/calendars')
    }
    finally {
      loadingCals.value = false
    }
  }
})

function connectGoogle() {
  window.location.href = '/api/auth/google/redirect'
}

async function disconnect() {
  disconnecting.value = true
  try {
    await googleStore.disconnect()
    await eventsStore.fetch()
  }
  finally {
    disconnecting.value = false
  }
}

async function saveCalendars() {
  savingCals.value = true
  try {
    await googleStore.saveCalendarSelection(
      availableCals.value.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color,
        selected: c.selected === 1,
      })),
    )
    await googleStore.sync()
    await eventsStore.fetch()
    router.replace('/settings')
  }
  finally {
    savingCals.value = false
  }
}

function goSelectCalendars() {
  router.push('/settings?step=calendars')
}

function timeSince(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  return `il y a ${Math.floor(diff / 3600)} h`
}
</script>
```

- [ ] **Step 11.2: Verify settings page**

Run: `npm run dev`, navigate to `http://localhost:3000/settings`

Expected:
- "Connecter un compte Google" card with button is shown (no account linked yet)
- Page title "Settings" in display font
- ⚙ icon in sidebar is highlighted/active

- [ ] **Step 11.3: Commit**

```bash
git add app/pages/settings.vue
git commit -m "feat(google): add settings page with Google Calendar management"
```

---

## Task 12: EventBar source badge

**Files:**
- Modify: `app/components/timeline/EventBar.vue`
- Modify: `app/pages/timeline.vue`

- [ ] **Step 12.1: Update `app/components/timeline/EventBar.vue`**

Add a small `G` or `M` badge before the event name. Replace the entire file:

```vue
<template>
  <div
    class="event-bar group hover:opacity-[.85] h-full overflow-hidden items-start"
    :style="{
      backgroundColor: colorBg,
      color: event.color,
      borderLeftColor: event.color,
    }"
    @click="$emit('click', event)"
  >
    <span class="text-[10px] font-medium opacity-70 whitespace-nowrap tabular-nums">
      {{ event.startTime }} – {{ event.endTime }}
    </span>
    <!-- Source badge -->
    <span
      class="text-[8px] font-bold flex-shrink-0 px-[4px] py-[1px] rounded-[2px] leading-tight"
      :style="{ background: 'currentColor' }"
    >
      <span style="color: white; mix-blend-mode: normal">{{ event.source === 'google' ? 'G' : 'M' }}</span>
    </span>
    <span class="text-xs font-medium flex-1 truncate">{{ event.name }}</span>
    <span
      v-if="event.tag"
      class="text-[9px] font-semibold tracking-[0.8px] uppercase opacity-65 px-[6px] py-[2px] rounded-[2px] bg-white/35 flex-shrink-0"
    >
      {{ event.tag }}
    </span>
    <button
      class="w-4 h-4 flex items-center justify-center rounded-[2px] bg-white/35 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 border-none cursor-pointer"
      style="color: inherit"
      @click.stop="$emit('delete', event.id)"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-[10px] h-[10px]" style="stroke-width:2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~~/types'
import { EVENT_COLOR_BG } from '~/stores/events'

const props = defineProps<{ event: CalendarEvent }>()
defineEmits<{
  click: [event: CalendarEvent]
  delete: [id: string]
}>()

const colorBg = computed(() => EVENT_COLOR_BG[props.event.color] ?? `${props.event.color}20`)
</script>
```

Note: `EVENT_COLOR_BG` only contains the 8 Meridian colors. The fallback `${props.event.color}20` appends `20` (hex for 12% opacity) so Google calendar colors render with proper background even if not in the map.

- [ ] **Step 12.2: Update `app/pages/timeline.vue` — all-day band + preserve Google fields**

Two changes needed in `timeline.vue`:

1. In `saveEvent`, preserve `source`, `googleEventId`, `googleCalendarId` from the original event when editing.
2. Add source badge to the all-day band.

Replace the `saveEvent` function (around line 242):

```ts
function saveEvent(eventData: Omit<CalendarEvent, 'id'>) {
  if (editingEvent.value) {
    store.updateEvent({
      ...eventData,
      id: editingEvent.value.id,
      source: editingEvent.value.source,
      googleEventId: editingEvent.value.googleEventId,
      googleCalendarId: editingEvent.value.googleCalendarId,
    })
  } else {
    store.addEvent(eventData)
  }
  editingEvent.value = null
}
```

Also add the source badge to the all-day band. Locate the `<span class="flex-1 truncate">{{ event.name }}</span>` inside the all-day `v-for` (around line 91) and add the badge before it:

```html
<!-- Before the event name span, add: -->
<span
  class="text-[8px] font-bold flex-shrink-0 px-[4px] py-[1px] rounded-[2px] leading-tight"
  :style="{ background: 'currentColor' }"
>
  <span style="color: white">{{ event.source === 'google' ? 'G' : 'M' }}</span>
</span>
<span class="flex-1 truncate">{{ event.name }}</span>
```

- [ ] **Step 12.3: Verify badges render**

Run: `npm run dev`

Expected:
- All existing events show a small `M` badge before their name in the timeline
- No layout regressions

- [ ] **Step 12.4: Commit**

```bash
git add app/components/timeline/EventBar.vue app/pages/timeline.vue
git commit -m "feat(google): add source badge (G/M) to event bars and all-day band"
```

---

## Task 13: EventModal — Google-specific behavior

**Files:**
- Modify: `app/components/ui/EventModal.vue`

- [ ] **Step 13.1: Update `app/components/ui/EventModal.vue`**

Three changes:
1. Show a source badge when editing a Google event
2. Hide color picker and tag picker for Google events; show locked color notice instead
3. Pass `source`, `googleEventId`, `googleCalendarId` through the `save` emit

Replace the entire file:

```vue
<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 bg-black/[.18] z-[200] flex items-end sm:items-center sm:justify-center"
        @click.self="$emit('update:open', false)"
      >
        <div
          class="bg-white sm:border sm:border-gray-200 sm:rounded-md sm:w-[440px] w-full rounded-t-2xl px-7 pt-7 pb-6 relative shadow-[0_8px_32px_rgba(0,0,0,0.1)] max-h-[90vh] overflow-y-auto sm:max-h-none sm:overflow-visible"
          style="animation: modalIn 0.15s ease"
        >
          <button
            class="absolute top-4 right-4 w-[26px] h-[26px] border border-gray-200 rounded flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition-all bg-transparent cursor-pointer"
            @click="$emit('update:open', false)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-3 h-3" style="stroke-width:2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <h2 class="font-display text-[18px] font-normal tracking-[-0.2px] mb-3">
            {{ isEditing ? 'Modifier l\'événement' : 'Nouvel événement' }}
          </h2>

          <!-- Google source badge -->
          <div v-if="isGoogleEvent" class="flex items-center gap-2 mb-4">
            <span
              class="w-2 h-2 rounded-full flex-shrink-0"
              :style="{ background: props.initialEvent?.color }"
            />
            <span class="text-[10px] text-gray-500 font-medium">
              {{ googleCalendarName }} · Google Calendar
            </span>
          </div>

          <div class="flex flex-col gap-[5px] mb-[14px]">
            <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Nom</label>
            <input
              ref="nameRef"
              v-model="form.name"
              class="form-input"
              placeholder="Réunion, déjeuner, sport..."
              @keydown.enter="submit"
            />
          </div>

          <div class="flex flex-col gap-[5px] mb-[14px]">
            <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Description</label>
            <textarea v-model="form.desc" class="form-input resize-none h-[60px] leading-relaxed" placeholder="Optionnel..." />
          </div>

          <div class="flex items-center gap-2 mb-[14px]">
            <input
              id="allDay"
              v-model="form.allDay"
              type="checkbox"
              class="w-[13px] h-[13px] cursor-pointer accent-black"
              @change="onAllDayChange"
            />
            <label for="allDay" class="text-[11px] font-medium text-gray-600 cursor-pointer select-none">
              Journée entière
            </label>
          </div>

          <div v-if="!form.allDay" class="flex gap-3 mb-[14px]">
            <div class="flex flex-col gap-[5px] flex-1">
              <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Début</label>
              <input v-model="form.start" type="datetime-local" class="form-input" />
            </div>
            <div class="flex flex-col gap-[5px] flex-1">
              <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Fin</label>
              <input v-model="form.end" type="datetime-local" class="form-input" />
            </div>
          </div>
          <div v-else class="flex gap-3 mb-[14px]">
            <div class="flex flex-col gap-[5px] flex-1">
              <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Début</label>
              <input v-model="form.startDate" type="date" class="form-input" />
            </div>
            <div class="flex flex-col gap-[5px] flex-1">
              <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Fin</label>
              <input v-model="form.endDate" type="date" class="form-input" />
            </div>
          </div>

          <div class="flex flex-col gap-[5px] mb-[14px]">
            <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Lieu</label>
            <input v-model="form.location" class="form-input" placeholder="Bureau, maison, en ligne..." />
          </div>

          <!-- Color: editable for Meridian, locked for Google -->
          <div class="flex flex-col gap-[5px] mb-[14px]">
            <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Couleur</label>
            <div v-if="!isGoogleEvent" class="flex gap-2 items-center">
              <ColorSwatch
                v-for="c in EVENT_COLORS"
                :key="c"
                :color="c"
                :selected="form.color === c"
                @select="form.color = $event"
              />
            </div>
            <div v-else class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ background: form.color }" />
              <span class="text-[10px] text-gray-400">Définie dans Settings → Calendriers</span>
            </div>
          </div>

          <!-- Tag: hidden for Google events -->
          <div v-if="!isGoogleEvent" class="flex flex-col gap-[5px] mb-[14px]">
            <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Tag</label>
            <div class="flex gap-[6px] flex-wrap items-center">
              <TagChip
                v-for="tag in tagsStore.tags"
                :key="tag.label"
                :label="tag.label"
                :selected="form.tag === tag.label"
                @select="form.tag = $event"
              />
              <template v-if="!addingTag">
                <button
                  class="px-[10px] py-1 rounded-[3px] text-[10px] font-semibold tracking-[0.5px] border border-dashed border-gray-200 text-gray-400 hover:text-black hover:border-black transition-all font-sans bg-transparent cursor-pointer"
                  @click="startAddTag"
                >
                  + Tag
                </button>
              </template>
              <template v-else>
                <input
                  ref="tagInputRef"
                  v-model="newTagValue"
                  class="border border-dashed border-gray-200 rounded-[3px] px-2 py-1 text-[10px] w-[100px] outline-none focus:border-black transition-colors font-sans"
                  placeholder="Nouveau tag..."
                  maxlength="20"
                  @keydown.enter="confirmNewTag"
                  @keydown.escape="addingTag = false; newTagValue = ''"
                />
              </template>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
            <button
              class="px-4 py-[7px] text-xs border border-gray-200 rounded-[3px] text-gray-600 hover:bg-gray-50 transition-all font-sans bg-transparent cursor-pointer"
              @click="$emit('update:open', false)"
            >
              Annuler
            </button>
            <button class="btn-primary" @click="submit">
              {{ isGoogleEvent ? 'Sauvegarder sur Google' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~~/types'
import { EVENT_COLORS } from '~/stores/events'
import { useTagsStore } from '~/stores/tags'
import { useGoogleStore } from '~/stores/google'

const props = defineProps<{
  open: boolean
  initialEvent?: CalendarEvent
  initialDate?: string
  initialStartTime?: string
  initialEndTime?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [event: Omit<CalendarEvent, 'id'>]
}>()

const tagsStore = useTagsStore()
const googleStore = useGoogleStore()
const addingTag = ref(false)
const newTagValue = ref('')
const tagInputRef = ref<HTMLInputElement>()
const nameRef = ref<HTMLInputElement>()

const isEditing = computed(() => !!props.initialEvent)
const isGoogleEvent = computed(() => props.initialEvent?.source === 'google')
const googleCalendarName = computed(() => {
  if (!props.initialEvent?.googleCalendarId) return 'Google Calendar'
  return googleStore.calendars.find(c => c.id === props.initialEvent?.googleCalendarId)?.name ?? 'Google Calendar'
})

const form = reactive({
  name: '',
  desc: '',
  allDay: false,
  start: '',
  end: '',
  startDate: '',
  endDate: '',
  location: '',
  color: EVENT_COLORS[0] ?? '#4a90d9',
  tag: tagsStore.tags[0]?.label ?? 'Perso',
})

watch(
  () => props.open,
  async (val) => {
    if (!val) return
    addingTag.value = false
    newTagValue.value = ''
    const date = props.initialDate ?? new Date().toISOString().slice(0, 10)
    if (props.initialEvent) {
      form.name = props.initialEvent.name
      form.desc = props.initialEvent.desc ?? ''
      form.allDay = props.initialEvent.allDay ?? false
      form.start = `${props.initialEvent.startDate}T${props.initialEvent.startTime}`
      form.end = `${props.initialEvent.endDate}T${props.initialEvent.endTime}`
      form.startDate = props.initialEvent.startDate
      form.endDate = props.initialEvent.endDate
      form.location = props.initialEvent.location ?? ''
      form.color = props.initialEvent.color
      form.tag = props.initialEvent.tag
    } else {
      form.name = ''
      form.desc = ''
      form.allDay = false
      form.start = `${date}T${props.initialStartTime ?? '09:00'}`
      form.end = `${date}T${props.initialEndTime ?? '10:00'}`
      form.startDate = date
      form.endDate = date
      form.location = ''
      form.color = EVENT_COLORS[0] ?? '#4a90d9'
      form.tag = tagsStore.tags[0]?.label ?? 'Perso'
    }
    await nextTick()
    nameRef.value?.focus()
  },
)

function onAllDayChange() {
  if (form.allDay) {
    form.startDate = form.start.slice(0, 10)
    form.endDate = form.end.slice(0, 10) || form.start.slice(0, 10)
  } else {
    form.start = `${form.startDate}T00:00`
    form.end = `${form.endDate}T23:59`
  }
}

watch(addingTag, async (val) => {
  if (val) {
    await nextTick()
    tagInputRef.value?.focus()
  }
})

async function startAddTag() {
  addingTag.value = true
}

function confirmNewTag() {
  const val = newTagValue.value.trim()
  if (val) {
    tagsStore.addTag(val)
    form.tag = val
  }
  addingTag.value = false
  newTagValue.value = ''
}

function submit() {
  if (!form.name.trim()) return
  const googleFields = {
    source: props.initialEvent?.source ?? 'meridian' as const,
    googleEventId: props.initialEvent?.googleEventId,
    googleCalendarId: props.initialEvent?.googleCalendarId,
  }
  if (form.allDay) {
    if (!form.startDate) return
    const endDate = form.endDate || form.startDate
    if (endDate < form.startDate) return
    emit('save', {
      name: form.name.trim(),
      desc: form.desc || undefined,
      allDay: true,
      startDate: form.startDate,
      startTime: '00:00',
      endDate,
      endTime: '23:59',
      location: form.location || undefined,
      color: form.color,
      tag: form.tag,
      ...googleFields,
    })
  } else {
    if (!form.start || !form.end) return
    if (form.end <= form.start) return
    const startParts = form.start.split('T')
    const endParts = form.end.split('T')
    emit('save', {
      name: form.name.trim(),
      desc: form.desc || undefined,
      allDay: false,
      startDate: startParts[0] ?? '',
      startTime: (startParts[1] ?? '00:00').slice(0, 5),
      endDate: endParts[0] ?? '',
      endTime: (endParts[1] ?? '00:00').slice(0, 5),
      location: form.location || undefined,
      color: form.color,
      tag: form.tag,
      ...googleFields,
    })
  }
  emit('update:open', false)
}
</script>
```

- [ ] **Step 13.2: Verify modal behavior**

Run: `npm run dev`

Expected:
- Creating a new event: modal shows color picker and tag selector, button reads "Enregistrer"
- No regression in existing event editing

- [ ] **Step 13.3: Commit**

```bash
git add app/components/ui/EventModal.vue
git commit -m "feat(google): update EventModal with Google source badge and locked color"
```

---

## Task 14: End-to-end verification

- [ ] **Step 14.1: Configure Google Cloud credentials**

In Google Cloud Console:
1. Create a project (or use existing)
2. Enable "Google Calendar API"
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID and Client Secret

Set in `.env`:
```env
NUXT_GOOGLE_CLIENT_ID=your-client-id
NUXT_GOOGLE_CLIENT_SECRET=your-client-secret
NUXT_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

- [ ] **Step 14.2: Test the full OAuth flow**

1. Run: `npm run dev`
2. Navigate to `http://localhost:3000/settings`
3. Click "Connecter" → browser redirects to Google OAuth
4. Authorize the app
5. Browser redirects to `/settings?step=calendars`
6. Select at least one calendar → click "Confirmer"

Expected: redirect to `/settings` with the connected account visible, calendar list shown.

- [ ] **Step 14.3: Test sync**

1. Reload the app at `http://localhost:3000/timeline`

Expected:
- Google events appear in the timeline with their calendar color
- Each event bar shows a `G` badge before its name

- [ ] **Step 14.4: Test creating a Meridian event**

1. Click "+ Ajouter" → fill in event name, save

Expected:
- Event appears in the timeline with an `M` badge
- In Google Calendar, a "Meridian" calendar was created and the event appears in it

- [ ] **Step 14.5: Test editing a Google event**

1. Click a Google event
2. Change the title → "Sauvegarder sur Google"

Expected:
- Event updated locally and in Google Calendar
- Color picker is hidden; "Définie dans Settings → Calendriers" is shown instead

- [ ] **Step 14.6: Test settings color override**

1. Go to `/settings`
2. Click a different color swatch for a calendar

Expected:
- All events from that calendar update their color in the timeline immediately (after `eventsStore.fetch()`)

- [ ] **Step 14.7: Final commit**

```bash
git add .
git commit -m "feat(google): complete Google Calendar integration"
```
