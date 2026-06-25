# SQLite Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le localStorage par une base SQLite locale exposée via des routes API Nitro, pour accéder aux données depuis n'importe quel appareil connecté au serveur.

**Architecture:** Les stores Pinia appellent `$fetch()` vers des routes Nitro dans `server/api/`. Drizzle ORM (better-sqlite3) gère le schéma et les requêtes. Le fichier `.db` est monté en volume Docker dans `/app/data/`.

**Tech Stack:** drizzle-orm, better-sqlite3, drizzle-kit, Nuxt server routes (Nitro/H3)

**Worktree:** Toute l'implémentation se fait dans `.claude/worktrees/feat+supabase-persistence/`

---

## File Map

| Statut | Fichier | Rôle |
|--------|---------|------|
| CRÉER | `server/db/schema.ts` | Définitions des tables Drizzle |
| CRÉER | `server/db/index.ts` | Connexion SQLite singleton + init schéma |
| CRÉER | `server/api/events/index.get.ts` | GET /api/events |
| CRÉER | `server/api/events/index.post.ts` | POST /api/events |
| CRÉER | `server/api/events/[id].put.ts` | PUT /api/events/:id |
| CRÉER | `server/api/events/[id].delete.ts` | DELETE /api/events/:id |
| CRÉER | `server/api/matrix/tasks/index.get.ts` | GET /api/matrix/tasks |
| CRÉER | `server/api/matrix/tasks/index.post.ts` | POST /api/matrix/tasks |
| CRÉER | `server/api/matrix/tasks/[id].put.ts` | PUT /api/matrix/tasks/:id |
| CRÉER | `server/api/matrix/tasks/[id].delete.ts` | DELETE /api/matrix/tasks/:id |
| CRÉER | `server/api/matrix/tasks/reorder.put.ts` | PUT /api/matrix/tasks/reorder |
| CRÉER | `server/api/matrix/notes.get.ts` | GET /api/matrix/notes |
| CRÉER | `server/api/matrix/notes.put.ts` | PUT /api/matrix/notes |
| CRÉER | `drizzle.config.ts` | Config Drizzle Kit (dev tooling) |
| CRÉER | `data/.gitkeep` | Garde le dossier data/ dans git |
| MODIFIER | `package.json` | Ajouter les dépendances |
| MODIFIER | `nuxt.config.ts` | runtimeConfig + nitro.externals |
| MODIFIER | `.gitignore` | Ignorer data/*.db |
| MODIFIER | `app/stores/events.ts` | Remplacer localStorage par $fetch |
| MODIFIER | `app/stores/matrix.ts` | Remplacer localStorage par $fetch |
| MODIFIER | `app/plugins/stores.client.ts` | Appeler fetch() au lieu de load() |
| MODIFIER | `app/components/matrix/MatrixQuadrant.vue` | @end + await pour les ajouts |
| MODIFIER | `docker-compose.yml` | Volume + env DATABASE_URL |
| MODIFIER | `Dockerfile` | Build tools natifs + dossier data |

---

## Task 1: Install packages and configure project

**Files:**
- Modify: `package.json`
- Modify: `nuxt.config.ts`
- Create: `drizzle.config.ts`
- Create: `data/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 1: Install dependencies**

```bash
cd .claude/worktrees/feat+supabase-persistence
npm install better-sqlite3 drizzle-orm
npm install --save-dev drizzle-kit @types/better-sqlite3
```

Expected: packages added to `node_modules/`, no errors.

- [ ] **Step 2: Update nuxt.config.ts**

Replace the full content of `nuxt.config.ts` with:

```ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  runtimeConfig: {
    databaseUrl: '',
    public: {
      appPassword: '',
    },
  },
  devtools: { enabled: true },
  ssr: false,
  components: [{ path: '~/components', pathPrefix: false }],
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],
  nitro: {
    externals: {
      external: ['better-sqlite3'],
    },
  },
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: '~/tailwind.config.ts',
  },
  app: {
    head: {
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@300;400;500;600&display=swap',
        },
      ],
    },
  },
})
```

- [ ] **Step 3: Create drizzle.config.ts**

```ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.NUXT_DATABASE_URL ?? './data/dev.db',
  },
} satisfies Config
```

- [ ] **Step 4: Create data/.gitkeep and update .gitignore**

Create an empty file `data/.gitkeep`.

Add to `.gitignore` (append at end of file):

```
# SQLite database
data/*.db
data/*.db-shm
data/*.db-wal
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json nuxt.config.ts drizzle.config.ts data/.gitkeep .gitignore
git commit -m "chore(store): install drizzle-orm, better-sqlite3 and configure nitro externals"
```

---

## Task 2: Database schema and connection

**Files:**
- Create: `server/db/schema.ts`
- Create: `server/db/index.ts`

- [ ] **Step 1: Create server/db/schema.ts**

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
```

- [ ] **Step 2: Create server/db/index.ts**

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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx nuxi typecheck
```

Expected: no errors on the new files.

- [ ] **Step 4: Commit**

```bash
git add server/db/schema.ts server/db/index.ts
git commit -m "feat(store): add Drizzle schema and SQLite connection module"
```

---

## Task 3: Events API routes

**Files:**
- Create: `server/api/events/index.get.ts`
- Create: `server/api/events/index.post.ts`
- Create: `server/api/events/[id].put.ts`
- Create: `server/api/events/[id].delete.ts`

- [ ] **Step 1: Create server/api/events/index.get.ts**

```ts
import { useDb } from '../../db'
import { events } from '../../db/schema'

export default defineEventHandler(() => {
  const db = useDb()
  const rows = db.select().from(events).all()
  return rows.map(r => ({ ...r, allDay: r.allDay === 1 || undefined }))
})
```

- [ ] **Step 2: Create server/api/events/index.post.ts**

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
  }).run()
  return { ...body, id, allDay: body.allDay || undefined }
})
```

- [ ] **Step 3: Create server/api/events/[id].put.ts**

```ts
import { useDb } from '../../../db'
import { events } from '../../../db/schema'
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
  }).where(eq(events.id, id)).run()
  return { ...body, allDay: body.allDay || undefined }
})
```

- [ ] **Step 4: Create server/api/events/[id].delete.ts**

```ts
import { useDb } from '../../../db'
import { events } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const db = useDb()
  db.delete(events).where(eq(events.id, id)).run()
  return { ok: true }
})
```

- [ ] **Step 5: Start dev server and test routes with curl**

```bash
npm run dev &
sleep 5
```

Create an event:
```bash
curl -s -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","startDate":"2026-06-25","startTime":"09:00","endDate":"2026-06-25","endTime":"10:00","color":"#4a90d9","tag":"Perso"}' | jq .
```
Expected: `{"name":"Test","startDate":"2026-06-25",...,"id":"<timestamp>"}`

List events:
```bash
curl -s http://localhost:3000/api/events | jq .
```
Expected: array with the created event.

Update the event (replace `<ID>` with the returned id):
```bash
curl -s -X PUT http://localhost:3000/api/events/<ID> \
  -H "Content-Type: application/json" \
  -d '{"id":"<ID>","name":"Updated","startDate":"2026-06-25","startTime":"09:00","endDate":"2026-06-25","endTime":"10:00","color":"#4a90d9","tag":"Perso"}' | jq .
```
Expected: event with `"name":"Updated"`.

Delete the event:
```bash
curl -s -X DELETE http://localhost:3000/api/events/<ID> | jq .
```
Expected: `{"ok":true}`

List events (should be empty):
```bash
curl -s http://localhost:3000/api/events | jq .
```
Expected: `[]`

Stop the dev server: `kill %1`

- [ ] **Step 6: Commit**

```bash
git add server/api/events/
git commit -m "feat(events): add CRUD API routes for events"
```

---

## Task 4: Matrix tasks API routes

**Files:**
- Create: `server/api/matrix/tasks/index.get.ts`
- Create: `server/api/matrix/tasks/index.post.ts`
- Create: `server/api/matrix/tasks/[id].put.ts`
- Create: `server/api/matrix/tasks/[id].delete.ts`
- Create: `server/api/matrix/tasks/reorder.put.ts`

- [ ] **Step 1: Create server/api/matrix/tasks/index.get.ts**

Returns all tasks grouped by quadrant, ordered by `position` within each quadrant.

```ts
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
```

- [ ] **Step 2: Create server/api/matrix/tasks/index.post.ts**

```ts
import { useDb } from '../../../db'
import { tasks } from '../../../db/schema'
import { eq, and, max } from 'drizzle-orm'
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
```

- [ ] **Step 3: Create server/api/matrix/tasks/[id].put.ts**

```ts
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
```

- [ ] **Step 4: Create server/api/matrix/tasks/[id].delete.ts**

```ts
import { useDb } from '../../../../db'
import { tasks } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const db = useDb()
  db.delete(tasks).where(eq(tasks.id, id)).run()
  return { ok: true }
})
```

- [ ] **Step 5: Create server/api/matrix/tasks/reorder.put.ts**

Nitro préfère les routes statiques aux routes dynamiques, donc `/reorder` ne sera pas confondu avec `/:id`.

```ts
import { useDb } from '../../../../db'
import { tasks } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { ids } = await readBody<{ quadrant: string; ids: string[] }>(event)
  const db = useDb()
  for (let i = 0; i < ids.length; i++) {
    db.update(tasks).set({ position: i }).where(eq(tasks.id, ids[i])).run()
  }
  return { ok: true }
})
```

- [ ] **Step 6: Test routes with curl**

```bash
npm run dev &
sleep 5
```

Lister les tâches (toutes quadrants vides) :
```bash
curl -s http://localhost:3000/api/matrix/tasks | jq .
```
Expected: `{"inu":[],"iu":[],"ninu":[],"niu":[],"today":[],"tomorrow":[]}`

Créer deux tâches dans `iu` :
```bash
curl -s -X POST http://localhost:3000/api/matrix/tasks \
  -H "Content-Type: application/json" \
  -d '{"quadrant":"iu","text":"Tâche A"}' | jq .

curl -s -X POST http://localhost:3000/api/matrix/tasks \
  -H "Content-Type: application/json" \
  -d '{"quadrant":"iu","text":"Tâche B"}' | jq .
```
Expected: `{"id":"<ts>","text":"Tâche A","done":false}` puis idem pour B.

Vérifier l'ordre :
```bash
curl -s http://localhost:3000/api/matrix/tasks | jq '.iu'
```
Expected: `[{"id":"<A>","text":"Tâche A","done":false},{"id":"<B>","text":"Tâche B","done":false}]`

Réordonner (B avant A) — remplace `<A>` et `<B>` par les IDs retournés :
```bash
curl -s -X PUT http://localhost:3000/api/matrix/tasks/reorder \
  -H "Content-Type: application/json" \
  -d '{"quadrant":"iu","ids":["<B>","<A>"]}' | jq .
```
Expected: `{"ok":true}`

Vérifier le nouvel ordre :
```bash
curl -s http://localhost:3000/api/matrix/tasks | jq '.iu'
```
Expected: B avant A.

Marquer une tâche done :
```bash
curl -s -X PUT http://localhost:3000/api/matrix/tasks/<A> \
  -H "Content-Type: application/json" \
  -d '{"done":true}' | jq .
```
Expected: `{"ok":true}`

Supprimer une tâche :
```bash
curl -s -X DELETE http://localhost:3000/api/matrix/tasks/<B> | jq .
```
Expected: `{"ok":true}`

Stop: `kill %1`

- [ ] **Step 7: Commit**

```bash
git add server/api/matrix/tasks/
git commit -m "feat(matrix): add CRUD and reorder API routes for tasks"
```

---

## Task 5: Matrix notes API routes

**Files:**
- Create: `server/api/matrix/notes.get.ts`
- Create: `server/api/matrix/notes.put.ts`

- [ ] **Step 1: Create server/api/matrix/notes.get.ts**

```ts
import { useDb } from '../db'
import { matrixNotes } from '../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(() => {
  const db = useDb()
  const row = db.select().from(matrixNotes).where(eq(matrixNotes.id, 1)).get()
  return { content: row?.content ?? '' }
})
```

- [ ] **Step 2: Create server/api/matrix/notes.put.ts**

```ts
import { useDb } from '../db'
import { matrixNotes } from '../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { content } = await readBody<{ content: string }>(event)
  const db = useDb()
  db.update(matrixNotes).set({ content }).where(eq(matrixNotes.id, 1)).run()
  return { content }
})
```

- [ ] **Step 3: Test routes with curl**

```bash
npm run dev &
sleep 5

curl -s http://localhost:3000/api/matrix/notes | jq .
```
Expected: `{"content":""}`

```bash
curl -s -X PUT http://localhost:3000/api/matrix/notes \
  -H "Content-Type: application/json" \
  -d '{"content":"Mes notes de test"}' | jq .
```
Expected: `{"content":"Mes notes de test"}`

```bash
curl -s http://localhost:3000/api/matrix/notes | jq .
```
Expected: `{"content":"Mes notes de test"}`

Stop: `kill %1`

- [ ] **Step 4: Commit**

```bash
git add server/api/matrix/notes.get.ts server/api/matrix/notes.put.ts
git commit -m "feat(matrix): add GET/PUT API routes for matrix notes"
```

---

## Task 6: Refactor events store

**Files:**
- Modify: `app/stores/events.ts`

- [ ] **Step 1: Replace app/stores/events.ts**

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
      this.events = await $fetch<CalendarEvent[]>('/api/events')
    },
    async addEvent(event: Omit<CalendarEvent, 'id'>) {
      const created = await $fetch<CalendarEvent>('/api/events', {
        method: 'POST',
        body: event,
      })
      this.events.push(created)
    },
    async updateEvent(updated: CalendarEvent) {
      const result = await $fetch<CalendarEvent>(`/api/events/${updated.id}`, {
        method: 'PUT',
        body: updated,
      })
      const idx = this.events.findIndex(e => e.id === result.id)
      if (idx !== -1) this.events[idx] = result
    },
    async deleteEvent(id: string) {
      await $fetch(`/api/events/${id}`, { method: 'DELETE' })
      this.events = this.events.filter(e => e.id !== id)
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx nuxi typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/stores/events.ts
git commit -m "feat(events): replace localStorage with API calls in events store"
```

---

## Task 7: Refactor matrix store

**Files:**
- Modify: `app/stores/matrix.ts`

- [ ] **Step 1: Replace app/stores/matrix.ts**

```ts
import { defineStore } from 'pinia'
import type { Task, QuadrantId } from '~~/types'

export const useMatrixStore = defineStore('matrix', {
  state: () => ({
    tasks: {
      inu: [],
      iu: [],
      ninu: [],
      niu: [],
      today: [],
      tomorrow: [],
    } as Record<QuadrantId, Task[]>,
    notes: '',
  }),
  actions: {
    async fetch() {
      const [tasksData, notesData] = await Promise.all([
        $fetch<Record<QuadrantId, Task[]>>('/api/matrix/tasks'),
        $fetch<{ content: string }>('/api/matrix/notes'),
      ])
      this.tasks = tasksData
      this.notes = notesData.content
    },
    async addTask(quadrant: QuadrantId, text = ''): Promise<string> {
      const task = await $fetch<Task>('/api/matrix/tasks', {
        method: 'POST',
        body: { quadrant, text },
      })
      this.tasks[quadrant].push(task)
      await this.reorderTasks(quadrant)
      return task.id
    },
    async addTaskAt(quadrant: QuadrantId, afterIndex: number): Promise<string> {
      const task = await $fetch<Task>('/api/matrix/tasks', {
        method: 'POST',
        body: { quadrant, text: '' },
      })
      this.tasks[quadrant].splice(afterIndex + 1, 0, task)
      await this.reorderTasks(quadrant)
      return task.id
    },
    async updateTask(quadrant: QuadrantId, id: string, patch: Partial<Task>) {
      await $fetch(`/api/matrix/tasks/${id}`, {
        method: 'PUT',
        body: patch,
      })
      const task = this.tasks[quadrant].find(t => t.id === id)
      if (task) Object.assign(task, patch)
    },
    async deleteTask(quadrant: QuadrantId, id: string) {
      await $fetch(`/api/matrix/tasks/${id}`, { method: 'DELETE' })
      this.tasks[quadrant] = this.tasks[quadrant].filter(t => t.id !== id)
      await this.reorderTasks(quadrant)
    },
    async reorderTasks(quadrant: QuadrantId) {
      await $fetch('/api/matrix/tasks/reorder', {
        method: 'PUT',
        body: { quadrant, ids: this.tasks[quadrant].map(t => t.id) },
      })
    },
    async setNotes(value: string) {
      this.notes = value
      await $fetch('/api/matrix/notes', {
        method: 'PUT',
        body: { content: value },
      })
    },
  },
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx nuxi typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/stores/matrix.ts
git commit -m "feat(matrix): replace localStorage with API calls in matrix store"
```

---

## Task 8: Update plugin and MatrixQuadrant component

**Files:**
- Modify: `app/plugins/stores.client.ts`
- Modify: `app/components/matrix/MatrixQuadrant.vue`

- [ ] **Step 1: Update app/plugins/stores.client.ts**

```ts
import { useEventsStore } from '~/stores/events'
import { useTagsStore } from '~/stores/tags'
import { useMatrixStore } from '~/stores/matrix'

export default defineNuxtPlugin(async () => {
  const eventsStore = useEventsStore()
  const tagsStore = useTagsStore()
  const matrixStore = useMatrixStore()
  tagsStore.load()
  await Promise.all([
    eventsStore.fetch(),
    matrixStore.fetch(),
  ])
})
```

- [ ] **Step 2: Update MatrixQuadrant.vue**

Three changes in the `<script setup>` block:

1. `@end="store.save()"` → `@end="store.reorderTasks(quadrantId)"` (template)
2. `store.addTask(props.quadrantId)` → `await store.addTask(props.quadrantId)` (addTask function)
3. `store.addTaskAt(props.quadrantId, index)` → `await store.addTaskAt(props.quadrantId, index)` (addNext function)

Full updated file:

```vue
<template>
  <div class="flex flex-col overflow-hidden" :class="containerClass">
    <div class="mb-2 pb-[7px] border-b border-gray-200 flex-shrink-0">
      <div class="text-[9px] font-semibold tracking-[1px] uppercase text-black">{{ title }}</div>
      <div v-if="subtitle" class="text-[9px] text-gray-400 mt-[1px] italic">{{ subtitle }}</div>
    </div>
    <VueDraggable
      v-model="store.tasks[quadrantId]"
      group="tasks"
      :animation="150"
      class="flex-1 overflow-y-auto scrollbar-thin"
      @end="store.reorderTasks(quadrantId)"
    >
      <MatrixTaskItem
        v-for="(task, index) in store.tasks[quadrantId]"
        :key="task.id"
        :ref="(el) => setItemRef(el, index)"
        :task="task"
        :quadrant-id="quadrantId"
        @add-next="addNext(index)"
        @focus-prev="focusPrev(index)"
      />
    </VueDraggable>
    <button
      class="text-[10px] text-gray-300 cursor-pointer pt-[3px] transition-colors hover:text-gray-600 bg-transparent border-none font-sans flex-shrink-0 text-left"
      @click="addTask"
    >
      + ajouter
    </button>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { QuadrantId } from '~~/types'

const props = defineProps<{
  title: string
  subtitle?: string
  containerClass?: string
  quadrantId: QuadrantId
}>()

const store = useMatrixStore()

type ItemRef = { focus: () => void } | null
const itemRefs = ref<ItemRef[]>([])

function setItemRef(el: unknown, index: number) {
  itemRefs.value[index] = el as ItemRef
}

async function addTask() {
  await store.addTask(props.quadrantId)
  await nextTick()
  const last = itemRefs.value[store.tasks[props.quadrantId].length - 1]
  last?.focus()
}

async function addNext(index: number) {
  await store.addTaskAt(props.quadrantId, index)
  await nextTick()
  itemRefs.value[index + 1]?.focus()
}

function focusPrev(index: number) {
  if (index > 0) itemRefs.value[index - 1]?.focus()
}
</script>
```

- [ ] **Step 3: Start dev server and test in browser**

```bash
npm run dev
```

Ouvrir http://localhost:3000 dans le navigateur.

Vérifier les points suivants :
1. La page Timeline charge sans erreur console
2. La page Matrix charge avec les tâches (vide au premier lancement)
3. Créer un événement sur la Timeline → il persiste après rechargement de la page
4. Ajouter une tâche dans un quadrant → elle persiste après rechargement
5. Cocher/décocher une tâche → l'état persiste après rechargement
6. Drag-and-drop une tâche entre quadrants → le nouvel ordre persiste après rechargement
7. Écrire une note dans la zone notes → persiste après rechargement
8. Ouvrir un second navigateur (ou onglet navigation privée) vers http://localhost:3000 → les mêmes données apparaissent

- [ ] **Step 4: Commit**

```bash
git add app/plugins/stores.client.ts app/components/matrix/MatrixQuadrant.vue
git commit -m "feat(store): wire stores to API on startup and update MatrixQuadrant for async actions"
```

---

## Task 9: Update Docker configuration

**Files:**
- Modify: `docker-compose.yml`
- Modify: `Dockerfile`

- [ ] **Step 1: Update docker-compose.yml**

```yaml
services:
  app:
    build: .
    ports:
      - "3006:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - NUXT_DATABASE_URL=/app/data/meridian.db
    restart: unless-stopped
```

- [ ] **Step 2: Update Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.output ./.output
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

Les build tools (`python3 make g++`) sont nécessaires dans les deux stages pour compiler la dépendance native `better-sqlite3`.

- [ ] **Step 3: Test the Docker build**

```bash
docker compose build
```

Expected: build succeeds without errors.

```bash
docker compose up -d
sleep 5
curl -s http://localhost:3006/api/events | jq .
```

Expected: `[]` (DB créée automatiquement dans le volume).

```bash
curl -s -X POST http://localhost:3006/api/events \
  -H "Content-Type: application/json" \
  -d '{"name":"Docker test","startDate":"2026-06-25","startTime":"10:00","endDate":"2026-06-25","endTime":"11:00","color":"#4a90d9","tag":"Perso"}' | jq .
```

Expected: event créé avec un id.

Redémarrer le container et vérifier la persistance :
```bash
docker compose restart
sleep 5
curl -s http://localhost:3006/api/events | jq .
```

Expected: l'événement créé précédemment est toujours présent.

```bash
docker compose down
```

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml Dockerfile
git commit -m "chore(docker): add volume for SQLite persistence and native build tools"
```

---

## Self-Review Checklist

- [x] **Events CRUD** : GET, POST, PUT, DELETE couverts dans Task 3
- [x] **Matrix tasks CRUD** : GET, POST, PUT, DELETE + reorder couverts dans Task 4
- [x] **Matrix notes** : GET + PUT couverts dans Task 5
- [x] **Stores refactorisés** : events (Task 6), matrix (Task 7)
- [x] **Plugin stores.client.ts** : mis à jour dans Task 8
- [x] **MatrixQuadrant.vue** : @end + await couverts dans Task 8
- [x] **Docker** : volume + env + build tools dans Task 9
- [x] **DB auto-créée** : `mkdirSync` + `CREATE TABLE IF NOT EXISTS` dans Task 2
- [x] **Tags** : restent en localStorage (hors périmètre, `tagsStore.load()` conservé)
- [x] **Worktree** : rappel de travailler dans `.claude/worktrees/feat+supabase-persistence/`
