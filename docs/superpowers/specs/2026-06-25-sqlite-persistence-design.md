# Design — Persistance SQLite (Drizzle ORM + Nuxt server routes)

**Date :** 2026-06-25
**Scope :** Remplacer le localStorage par une base SQLite locale, accessible depuis n'importe quel appareil connecté au serveur.

---

## Contexte

Meridian utilise actuellement `localStorage` pour persister les événements (`meridian_events_v1`) et les tâches de la matrice (`meridian_matrix_v1`). Cette approche est limitée à un seul navigateur/appareil.

L'objectif est de migrer vers une DB SQLite hébergée dans le container Docker, exposée via des routes API Nitro. Tous les appareils accèdent aux mêmes données en se connectant au serveur.

---

## Architecture

```
Browser (Vue/Pinia)
    │  $fetch()
    ▼
Nitro server (Nuxt)
  server/
  ├── db/
  │   ├── index.ts      ← connexion SQLite singleton (better-sqlite3 + drizzle)
  │   └── schema.ts     ← schéma Drizzle (3 tables)
  └── api/
      ├── events/
      │   ├── index.get.ts       GET    /api/events
      │   ├── index.post.ts      POST   /api/events
      │   ├── [id].put.ts        PUT    /api/events/:id
      │   └── [id].delete.ts     DELETE /api/events/:id
      └── matrix/
          ├── tasks/
          │   ├── index.get.ts   GET    /api/matrix/tasks
          │   ├── index.post.ts  POST   /api/matrix/tasks
          │   ├── [id].put.ts    PUT    /api/matrix/tasks/:id
          │   └── [id].delete.ts DELETE /api/matrix/tasks/:id
          ├── notes.get.ts       GET    /api/matrix/notes
          └── notes.put.ts       PUT    /api/matrix/notes
```

- Le mode SPA Vue reste inchangé (les server routes Nitro fonctionnent indépendamment du SSR)
- Les stores Pinia gardent leur état en mémoire comme cache — un seul `fetch` au montage, puis mutations locales + appels API en parallèle
- Le fichier `.db` est stocké dans `/app/data/meridian.db`, monté en volume Docker

---

## Schéma de base de données

```ts
// Table events
{
  id:        text PRIMARY KEY,
  name:      text NOT NULL,
  desc:      text,
  startDate: text NOT NULL,   // YYYY-MM-DD
  startTime: text NOT NULL,   // HH:MM
  endDate:   text NOT NULL,
  endTime:   text NOT NULL,
  location:  text,
  color:     text NOT NULL,
  tag:       text NOT NULL,
  allDay:    integer NOT NULL  // 0 | 1
}

// Table tasks
{
  id:       text PRIMARY KEY,
  quadrant: text NOT NULL,    // QuadrantId : 'iu' | 'inu' | 'ninu' | 'niu' | 'today' | 'tomorrow'
  text:     text NOT NULL,
  done:     integer NOT NULL, // 0 | 1
  position: integer NOT NULL  // ordre dans le quadrant (drag-and-drop)
}

// Table matrix_notes (singleton, id = 1 toujours)
{
  id:      integer PRIMARY KEY,
  content: text NOT NULL
}
```

La colonne `position` dans `tasks` est nouvelle — elle remplace l'ordre implicite donné par l'index du tableau en localStorage.

---

## Migrations

- Générées par **Drizzle Kit** (`drizzle-kit generate`)
- Appliquées automatiquement au démarrage via un **plugin Nitro server** (`server/plugins/migrations.ts`)
- Les fichiers SQL de migration sont versionnés dans `server/db/migrations/`

---

## Refactoring des stores Pinia

Les actions `load()` / `save()` disparaissent. Les actions deviennent asynchrones et appellent `$fetch()` :

```ts
// events.ts — avant
addEvent(event) {
  this.events.push({ ...event, id: Date.now().toString() })
  this.save()
}

// events.ts — après
async addEvent(event: Omit<CalendarEvent, 'id'>) {
  const created = await $fetch<CalendarEvent>('/api/events', {
    method: 'POST',
    body: event,
  })
  this.events.push(created)
}
```

Même pattern pour `updateEvent`, `deleteEvent`, `addTask`, `updateTask`, `deleteTask`, `setNotes`.

Le chargement initial se fait dans `app/plugins/stores.client.ts` (déjà existant) : remplacer `store.load()` par `await store.fetch()`.

---

## Docker

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3006:3006"
    volumes:
      - ./data:/app/data   # SQLite persiste ici
    environment:
      - DATABASE_URL=/app/data/meridian.db
    restart: unless-stopped
```

```dockerfile
# Dockerfile — ajout du répertoire data
RUN mkdir -p /app/data
```

Aucun service supplémentaire — SQLite tourne dans le même container.

---

## Nouveaux packages

```
better-sqlite3          # driver SQLite synchrone
drizzle-orm             # ORM TypeScript-first
drizzle-kit             # CLI pour générer les migrations
@types/better-sqlite3   # types TypeScript
```

---

## Ce qui ne change pas

- Les types `CalendarEvent`, `Task`, `Tag`, `QuadrantId` dans `types/index.ts`
- Les composants Vue (aucun changement)
- La logique des getters Pinia
- Le système d'auth par mot de passe existant
- Les tags (store `tags.ts`) restent en localStorage — scope hors périmètre

---

## Périmètre exclu

- Synchronisation temps réel (pas de WebSocket ou Supabase Realtime)
- Migration des données existantes depuis localStorage (les données locales sont perdues — outil personnel, acceptable)
- Auth multi-utilisateurs
- Migration des tags vers la DB
