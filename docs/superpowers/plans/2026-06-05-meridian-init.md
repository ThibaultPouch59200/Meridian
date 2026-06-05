# Meridian — Initialisation Nuxt 3 : Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffolder un projet Nuxt 3 SPA complet avec la page Timeline interactive (CRUD événements, navigation dates, vue jour/mois) et un squelette Matrix navigable.

**Architecture:** Nuxt 3 SPA (`ssr: false`) + Tailwind CSS v3 + Pinia. Chaque composant a une responsabilité unique. Les stores Pinia centralisent l'état et la persistance localStorage. Les composables encapsulent la logique réutilisable (temps courant, sélection d'événements). Toujours sur une branche dédiée, jamais sur `main`.

**Tech Stack:** Nuxt 3, TypeScript strict, Tailwind CSS v3 (@nuxtjs/tailwindcss), Pinia (@pinia/nuxt), localStorage, Docker multi-stage.

**Ref visuelle :** `docs/maquette.html`

---

## Fichiers créés / modifiés

```
app.vue                                      modifié  — NuxtLayout + NuxtPage
nuxt.config.ts                               modifié  — SPA, modules, Google Fonts
tailwind.config.ts                           créé     — design tokens
assets/css/main.css                          créé     — classes partagées @apply
types/index.ts                               créé     — CalendarEvent, Task, Tag, QuadrantId
stores/events.ts                             créé     — state events + currentDate + actions CRUD
stores/tags.ts                               créé     — state tags + addTag
stores/matrix.ts                             créé     — stub vide
composables/useCurrentTime.ts                créé     — now: Ref<Date> mis à jour /min
composables/useEvents.ts                     créé     — dayEvents + eventsForDate
composables/useDragSelect.ts                 créé     — stub (jalon 2)
components/ui/IconButton.vue                 créé     — bouton icône générique
components/ui/ColorSwatch.vue               créé     — pastille couleur sélectionnable
components/ui/TagChip.vue                    créé     — chip tag sélectionnable
components/ui/EventModal.vue                 créé     — formulaire create/edit événement
components/layout/AppSidebar.vue             créé     — sidebar 52px avec nav Timeline/Matrix
layouts/default.vue                          créé     — AppSidebar + slot
components/timeline/CurrentTimeLine.vue      créé     — ligne rouge heure courante
components/timeline/EventBar.vue             créé     — barre d'événement affichée dans grille
components/timeline/TimelineHourRow.vue      créé     — ligne d'une heure (label + quarter-lines + events)
components/timeline/TimelineGrid.vue         créé     — boucle 24h + CurrentTimeLine
components/timeline/MonthCalendar.vue        créé     — calendrier mensuel avec pills
components/matrix/MatrixQuadrant.vue         créé     — quadrant Eisenhower (squelette)
components/matrix/MatrixTaskItem.vue         créé     — item de tâche (squelette)
components/matrix/MatrixNotesArea.vue        créé     — zone notes (squelette)
pages/index.vue                              créé     — redirect vers /timeline
pages/timeline.vue                           créé     — page timeline complète
pages/matrix.vue                             créé     — page matrix squelette
Dockerfile                                   créé
docker-compose.yml                           créé
```

---

## Task 1: Créer la branche de travail

**Files:** (aucun fichier modifié)

- [ ] **Step 1: Créer et basculer sur la branche**

```bash
git checkout -b feat/init-nuxt-scaffold
```

Expected output: `Switched to a new branch 'feat/init-nuxt-scaffold'`

- [ ] **Step 2: Vérifier**

```bash
git branch
```

Expected: `* feat/init-nuxt-scaffold` affiché.

---

## Task 2: Scaffolding Nuxt 3 et installation des dépendances

**Files:**
- Créé par nuxi: `package.json`, `tsconfig.json`, `nuxt.config.ts`, `app.vue`, `.gitignore`, `public/`, `server/`

- [ ] **Step 1: Initialiser le projet Nuxt 3 dans le répertoire courant**

```bash
cd /Users/pandorian/Delivery/Perso/Meridian && npx nuxi@latest init . --packageManager npm
```

Si nuxi demande "Do you want to overwrite existing files?" → répondre `yes`.
Si nuxi demande "Initialize git repository?" → répondre `no` (git déjà initialisé).
Si nuxi demande "Install packages?" → répondre `yes`.

- [ ] **Step 2: Installer les dépendances additionnelles**

```bash
npm install @nuxtjs/tailwindcss @pinia/nuxt pinia
```

- [ ] **Step 3: Vérifier que le projet démarre**

```bash
npm run dev
```

Expected: `Nuxt ... ready in ...ms` sans erreur. Ouvrir http://localhost:3000. La page Nuxt par défaut doit apparaître.

Ctrl+C pour stopper.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(config): scaffold nuxt 3 spa with tailwind and pinia"
```

---

## Task 3: Configurer nuxt.config.ts, tailwind.config.ts et assets/css/main.css

**Files:**
- Modify: `nuxt.config.ts`
- Create: `tailwind.config.ts`
- Create: `assets/css/main.css`

- [ ] **Step 1: Remplacer le contenu de nuxt.config.ts**

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: '~/tailwind.config.ts',
  },
  app: {
    head: {
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@300;400;500;600&display=swap',
        },
      ],
    },
  },
})
```

- [ ] **Step 2: Créer tailwind.config.ts**

Créer le fichier `tailwind.config.ts` à la racine :

```ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        black: '#0d0d0d',
        'gray-900': '#1a1a1a',
        'gray-600': '#666666',
        'gray-400': '#aaaaaa',
        'gray-200': '#dddddd',
        'gray-100': '#f0f0ee',
        'gray-50': '#f8f8f6',
      },
      fontFamily: {
        sans: ['Instrument Sans', 'sans-serif'],
        display: ['Instrument Serif', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 3: Créer assets/css/main.css**

Créer le répertoire `assets/css/` s'il n'existe pas, puis créer `assets/css/main.css` :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-black text-white text-xs font-medium rounded tracking-wide transition-opacity hover:opacity-80;
  }

  .section-label {
    @apply text-[9px] font-semibold tracking-[2px] uppercase text-gray-400;
  }

  .event-bar {
    @apply flex items-center gap-2 px-3 py-1.5 rounded-sm border-l-[3px] cursor-pointer transition-all hover:translate-x-px;
  }

  .form-input {
    @apply w-full font-sans text-[13px] border border-gray-200 rounded-[3px] px-[10px] py-[7px] outline-none text-black bg-white transition-colors duration-150 focus:border-black;
  }

  .scrollbar-thin::-webkit-scrollbar {
    width: 4px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #dddddd;
    border-radius: 2px;
  }
}

@keyframes modalIn {
  from { opacity: 0; transform: translateY(6px) scale(0.99); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

- [ ] **Step 4: Vérifier que le dev server redémarre sans erreur**

```bash
npm run dev
```

Expected: démarre sans erreur Tailwind. Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add nuxt.config.ts tailwind.config.ts assets/css/main.css
git commit -m "chore(config): configure tailwind tokens and main css"
```

---

## Task 4: Types TypeScript

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: Créer le répertoire types/ et types/index.ts**

```ts
// types/index.ts
export interface CalendarEvent {
  id: string
  name: string
  desc?: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  location?: string
  color: string
  tag: string
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

- [ ] **Step 2: Vérifier la compilation TypeScript**

```bash
npx nuxi typecheck
```

Expected: aucune erreur de type sur `types/index.ts`.

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat(types): add core typescript interfaces"
```

---

## Task 5: Stores Pinia (events, tags, matrix stub)

**Files:**
- Create: `stores/events.ts`
- Create: `stores/tags.ts`
- Create: `stores/matrix.ts`

- [ ] **Step 1: Créer stores/events.ts**

```ts
// stores/events.ts
import { defineStore } from 'pinia'
import type { CalendarEvent } from '~/types'

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

const STORAGE_KEY = 'meridian_events_v1'

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
      state.events.filter(e => e.startDate === state.currentDate),
    eventsForDate: (state) => (date: string): CalendarEvent[] =>
      state.events.filter(e => e.startDate === date),
  },
  actions: {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as { events?: CalendarEvent[] }
          this.events = parsed.events ?? []
        }
      } catch { /* ignore */ }
    },
    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ events: this.events }))
    },
    addEvent(event: Omit<CalendarEvent, 'id'>) {
      this.events.push({ ...event, id: Date.now().toString() })
      this.save()
    },
    updateEvent(updated: CalendarEvent) {
      const idx = this.events.findIndex(e => e.id === updated.id)
      if (idx !== -1) this.events[idx] = updated
      this.save()
    },
    deleteEvent(id: string) {
      this.events = this.events.filter(e => e.id !== id)
      this.save()
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

- [ ] **Step 2: Créer stores/tags.ts**

```ts
// stores/tags.ts
import { defineStore } from 'pinia'
import type { Tag } from '~/types'

const STORAGE_KEY = 'meridian_tags_v1'

export const useTagsStore = defineStore('tags', {
  state: () => ({
    tags: [
      { label: 'Perso', builtIn: true },
      { label: 'Travail', builtIn: true },
    ] as Tag[],
  }),
  actions: {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as { tags?: Tag[] }
          this.tags = parsed.tags ?? this.tags
        }
      } catch { /* ignore */ }
    },
    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tags: this.tags }))
    },
    addTag(label: string) {
      if (!this.tags.find(t => t.label === label)) {
        this.tags.push({ label, builtIn: false })
        this.save()
      }
    },
  },
})
```

- [ ] **Step 3: Créer stores/matrix.ts (stub)**

```ts
// stores/matrix.ts
import { defineStore } from 'pinia'

export const useMatrixStore = defineStore('matrix', {
  state: () => ({}),
})
```

- [ ] **Step 4: Vérifier TypeScript**

```bash
npx nuxi typecheck
```

Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add stores/
git commit -m "feat(store): add events and tags pinia stores"
```

---

## Task 6: Composables

**Files:**
- Create: `composables/useCurrentTime.ts`
- Create: `composables/useEvents.ts`
- Create: `composables/useDragSelect.ts`

- [ ] **Step 1: Créer composables/useCurrentTime.ts**

```ts
// composables/useCurrentTime.ts
export function useCurrentTime() {
  const now = ref(new Date())
  const interval = setInterval(() => { now.value = new Date() }, 60_000)
  onUnmounted(() => clearInterval(interval))
  return { now }
}
```

- [ ] **Step 2: Créer composables/useEvents.ts**

```ts
// composables/useEvents.ts
import { useEventsStore } from '~/stores/events'

export function useEvents() {
  const store = useEventsStore()
  const dayEvents = computed(() => store.dayEvents)
  function eventsForDate(date: string) {
    return store.eventsForDate(date)
  }
  return { dayEvents, eventsForDate }
}
```

- [ ] **Step 3: Créer composables/useDragSelect.ts (stub)**

```ts
// composables/useDragSelect.ts
// À implémenter au jalon 2 : sélection par glissement pour créer un événement
export function useDragSelect() {
  return {}
}
```

- [ ] **Step 4: Commit**

```bash
git add composables/
git commit -m "feat(composables): add useCurrentTime and useEvents"
```

---

## Task 7: Composants UI atomiques

**Files:**
- Create: `components/ui/IconButton.vue`
- Create: `components/ui/ColorSwatch.vue`
- Create: `components/ui/TagChip.vue`

- [ ] **Step 1: Créer components/ui/IconButton.vue**

```vue
<!-- components/ui/IconButton.vue -->
<template>
  <button
    :title="title"
    :class="[
      'w-9 h-9 flex items-center justify-center rounded-lg border-none transition-colors duration-150 cursor-pointer',
      active
        ? 'bg-white text-black shadow-sm'
        : 'bg-transparent text-gray-400 hover:bg-gray-100 hover:text-black',
    ]"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{ title: string; active?: boolean }>()
defineEmits<{ click: [] }>()
</script>
```

- [ ] **Step 2: Créer components/ui/ColorSwatch.vue**

```vue
<!-- components/ui/ColorSwatch.vue -->
<template>
  <button
    :style="{ background: color }"
    :class="[
      'w-[22px] h-[22px] rounded-full border-2 flex-shrink-0 transition-all duration-100 cursor-pointer',
      selected ? 'border-black scale-[1.08]' : 'border-transparent hover:scale-110',
    ]"
    @click="$emit('select', color)"
  />
</template>

<script setup lang="ts">
defineProps<{ color: string; selected: boolean }>()
defineEmits<{ select: [color: string] }>()
</script>
```

- [ ] **Step 3: Créer components/ui/TagChip.vue**

```vue
<!-- components/ui/TagChip.vue -->
<template>
  <button
    :class="[
      'px-[10px] py-1 rounded-[3px] text-[10px] font-semibold tracking-[0.5px] border transition-all duration-150 font-sans cursor-pointer',
      selected
        ? 'bg-black text-white border-black'
        : 'bg-transparent text-gray-600 border-gray-200 hover:border-black hover:text-black',
    ]"
    @click="$emit('select', label)"
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">
defineProps<{ label: string; selected: boolean }>()
defineEmits<{ select: [label: string] }>()
</script>
```

- [ ] **Step 4: Vérifier TypeScript**

```bash
npx nuxi typecheck
```

Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add components/ui/IconButton.vue components/ui/ColorSwatch.vue components/ui/TagChip.vue
git commit -m "feat(ui): add IconButton, ColorSwatch, TagChip components"
```

---

## Task 8: Layout — AppSidebar + default.vue + app.vue + index.vue

**Files:**
- Create: `components/layout/AppSidebar.vue`
- Create: `layouts/default.vue`
- Modify: `app.vue`
- Create: `pages/index.vue`

- [ ] **Step 1: Créer components/layout/AppSidebar.vue**

```vue
<!-- components/layout/AppSidebar.vue -->
<template>
  <nav class="w-[52px] h-screen flex flex-col items-center justify-center gap-[6px] flex-shrink-0 relative z-10">
    <div
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-[140px] bg-gray-200 pointer-events-none"
    />
    <IconButton title="Timeline" :active="route.path.startsWith('/timeline')" @click="navigateTo('/timeline')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-[18px] h-[18px]" style="stroke-width:1.4">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </IconButton>
    <IconButton title="Matrice" :active="route.path.startsWith('/matrix')" @click="navigateTo('/matrix')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-[18px] h-[18px]" style="stroke-width:1.4">
        <rect x="3" y="3" width="8" height="8" rx="1"/>
        <rect x="13" y="3" width="8" height="8" rx="1"/>
        <rect x="3" y="13" width="8" height="8" rx="1"/>
        <rect x="13" y="13" width="8" height="8" rx="1"/>
      </svg>
    </IconButton>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
```

- [ ] **Step 2: Créer layouts/default.vue**

```vue
<!-- layouts/default.vue -->
<template>
  <div class="flex w-full h-screen overflow-hidden bg-gray-50">
    <AppSidebar />
    <div class="flex-1 min-w-0 border-l border-gray-200 bg-white flex flex-col h-screen overflow-hidden">
      <slot />
    </div>
  </div>
</template>
```

- [ ] **Step 3: Remplacer le contenu de app.vue**

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

- [ ] **Step 4: Créer pages/index.vue**

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
await navigateTo('/timeline', { replace: true })
</script>
```

- [ ] **Step 5: Vérifier dans le navigateur**

```bash
npm run dev
```

Ouvrir http://localhost:3000. Expected:
- Redirection automatique vers `/timeline`
- Sidebar visible à gauche (52px, fond gris-50)
- Icône calendrier active (fond blanc), icône matrice inactive (grise)
- Cliquer sur l'icône matrice → URL change vers `/matrix` et l'icône devient active

Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add components/layout/AppSidebar.vue layouts/default.vue app.vue pages/index.vue
git commit -m "feat(layout): add AppSidebar, default layout, and root redirect"
```

---

## Task 9: Composants Timeline — CurrentTimeLine, EventBar, TimelineHourRow, TimelineGrid

**Files:**
- Create: `components/timeline/CurrentTimeLine.vue`
- Create: `components/timeline/EventBar.vue`
- Create: `components/timeline/TimelineHourRow.vue`
- Create: `components/timeline/TimelineGrid.vue`

- [ ] **Step 1: Créer components/timeline/CurrentTimeLine.vue**

```vue
<!-- components/timeline/CurrentTimeLine.vue -->
<template>
  <div
    v-if="isToday"
    class="absolute left-16 right-0 pointer-events-none z-[5]"
    :style="{ top: `${topPx}px` }"
  >
    <div class="w-full h-[1.5px] bg-[#e05555]" />
    <div class="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-[#e05555]" />
  </div>
</template>

<script setup lang="ts">
const HOUR_ROW_PX = 56

const props = defineProps<{ currentDate: string }>()
const { now } = useCurrentTime()

const isToday = computed(() => {
  const d = now.value
  const todayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return props.currentDate === todayKey
})

const topPx = computed(() => {
  const mins = now.value.getHours() * 60 + now.value.getMinutes()
  return mins * (HOUR_ROW_PX / 60)
})
</script>
```

- [ ] **Step 2: Créer components/timeline/EventBar.vue**

```vue
<!-- components/timeline/EventBar.vue -->
<template>
  <div
    class="event-bar group hover:opacity-[.85]"
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
import type { CalendarEvent } from '~/types'
import { EVENT_COLOR_BG } from '~/stores/events'

const props = defineProps<{ event: CalendarEvent }>()
defineEmits<{
  click: [event: CalendarEvent]
  delete: [id: string]
}>()

const colorBg = computed(() => EVENT_COLOR_BG[props.event.color] ?? 'rgba(74,144,217,0.12)')
</script>
```

- [ ] **Step 3: Créer components/timeline/TimelineHourRow.vue**

```vue
<!-- components/timeline/TimelineHourRow.vue -->
<template>
  <div class="flex items-stretch border-b border-gray-100 relative min-h-14 hover:bg-black/[.01]">
    <div class="w-16 flex-shrink-0 pt-2 pl-6 pr-4 text-[11px] font-medium text-gray-400 tracking-[0.3px] tabular-nums select-none">
      {{ label }}
    </div>
    <div class="flex-1 flex flex-col relative">
      <div class="absolute inset-0 flex flex-col pointer-events-none">
        <div v-for="q in 4" :key="q" class="flex-1 border-b border-gray-100 last:border-b-0" />
      </div>
      <div class="relative z-[1] py-1 pl-2 pr-4 flex flex-col gap-[3px] min-h-12">
        <EventBar
          v-for="event in eventsInHour"
          :key="event.id"
          :event="event"
          @click="$emit('event-click', $event)"
          @delete="$emit('event-delete', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~/types'

const props = defineProps<{
  hour: number
  events: CalendarEvent[]
}>()

defineEmits<{
  'event-click': [event: CalendarEvent]
  'event-delete': [id: string]
}>()

const label = computed(() => String(props.hour).padStart(2, '0') + ':00')

const eventsInHour = computed(() =>
  props.events.filter(e => parseInt(e.startTime.split(':')[0]) === props.hour),
)
</script>
```

- [ ] **Step 4: Créer components/timeline/TimelineGrid.vue**

```vue
<!-- components/timeline/TimelineGrid.vue -->
<template>
  <div class="relative min-h-full">
    <CurrentTimeLine :current-date="currentDate" />
    <TimelineHourRow
      v-for="hour in hours"
      :key="hour"
      :hour="hour"
      :events="dayEvents"
      @event-click="$emit('event-click', $event)"
      @event-delete="$emit('event-delete', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~/types'

defineProps<{
  currentDate: string
  dayEvents: CalendarEvent[]
}>()

defineEmits<{
  'event-click': [event: CalendarEvent]
  'event-delete': [id: string]
}>()

const hours = Array.from({ length: 24 }, (_, i) => i)
</script>
```

- [ ] **Step 5: Vérifier TypeScript**

```bash
npx nuxi typecheck
```

Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add components/timeline/CurrentTimeLine.vue components/timeline/EventBar.vue components/timeline/TimelineHourRow.vue components/timeline/TimelineGrid.vue
git commit -m "feat(timeline): add TimelineGrid, TimelineHourRow, EventBar, CurrentTimeLine"
```

---

## Task 10: MonthCalendar.vue

**Files:**
- Create: `components/timeline/MonthCalendar.vue`

- [ ] **Step 1: Créer components/timeline/MonthCalendar.vue**

```vue
<!-- components/timeline/MonthCalendar.vue -->
<template>
  <div class="flex-1 flex flex-col overflow-hidden p-5 gap-3 min-h-0">
    <div class="grid grid-cols-7">
      <div
        v-for="day in weekdays"
        :key="day"
        class="text-center text-[10px] font-semibold tracking-[1px] uppercase text-gray-400 py-1.5"
      >
        {{ day }}
      </div>
    </div>
    <div
      class="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 overflow-hidden flex-1"
      style="grid-template-rows: repeat(6, 1fr)"
    >
      <div
        v-for="cell in cells"
        :key="cell.key"
        :class="[
          'bg-white p-2 cursor-pointer flex flex-col gap-[3px] overflow-hidden transition-colors duration-150 hover:bg-gray-50',
          !cell.currentMonth && 'bg-gray-50',
          cell.isSelected && 'outline outline-2 -outline-offset-2 outline-black',
        ]"
        @click="$emit('select-date', cell.key)"
      >
        <div
          :class="[
            'text-xs font-medium leading-[22px]',
            !cell.currentMonth && 'text-gray-400',
            cell.isToday
              ? 'bg-black text-white w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-semibold'
              : '',
          ]"
        >
          {{ cell.day }}
        </div>
        <div v-if="cell.events.length" class="flex flex-col gap-[2px] overflow-hidden">
          <div
            v-for="ev in cell.events.slice(0, 3)"
            :key="ev.id"
            class="text-[9px] font-medium px-[5px] py-[1px] rounded-[2px] truncate opacity-[.85]"
            :style="{ background: colorBg(ev.color), color: ev.color }"
          >
            {{ ev.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~/types'
import { EVENT_COLOR_BG } from '~/stores/events'

const props = defineProps<{
  year: number
  month: number
  selectedDate: string
  eventsForDate: (date: string) => CalendarEvent[]
}>()

defineEmits<{ 'select-date': [date: string] }>()

const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const cells = computed(() => {
  const firstDay = new Date(props.year, props.month, 1)
  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1
  const todayKey = dateKey(new Date())

  return Array.from({ length: 42 }, (_, i) => {
    const cellDate = new Date(props.year, props.month, 1 + (i - startDow))
    const key = dateKey(cellDate)
    return {
      key,
      day: cellDate.getDate(),
      currentMonth: cellDate.getMonth() === props.month,
      isToday: key === todayKey,
      isSelected: key === props.selectedDate,
      events: props.eventsForDate(key),
    }
  })
})

function colorBg(color: string): string {
  return EVENT_COLOR_BG[color] ?? 'rgba(74,144,217,0.12)'
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add components/timeline/MonthCalendar.vue
git commit -m "feat(timeline): add MonthCalendar component"
```

---

## Task 11: EventModal.vue

**Files:**
- Create: `components/ui/EventModal.vue`

- [ ] **Step 1: Créer components/ui/EventModal.vue**

```vue
<!-- components/ui/EventModal.vue -->
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
        class="fixed inset-0 bg-black/[.18] z-[200] flex items-center justify-center"
        @click.self="$emit('update:open', false)"
      >
        <div
          class="bg-white border border-gray-200 rounded-md w-[440px] px-7 pt-7 pb-6 relative shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
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

          <h2 class="font-display text-[18px] font-normal tracking-[-0.2px] mb-5">
            {{ isEditing ? 'Modifier l\'événement' : 'Nouvel événement' }}
          </h2>

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

          <div class="flex gap-3 mb-[14px]">
            <div class="flex flex-col gap-[5px] flex-1">
              <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Début</label>
              <input v-model="form.start" type="datetime-local" class="form-input" />
            </div>
            <div class="flex flex-col gap-[5px] flex-1">
              <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Fin</label>
              <input v-model="form.end" type="datetime-local" class="form-input" />
            </div>
          </div>

          <div class="flex flex-col gap-[5px] mb-[14px]">
            <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Lieu</label>
            <input v-model="form.location" class="form-input" placeholder="Bureau, maison, en ligne..." />
          </div>

          <div class="flex flex-col gap-[5px] mb-[14px]">
            <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Couleur</label>
            <div class="flex gap-2 items-center">
              <ColorSwatch
                v-for="c in EVENT_COLORS"
                :key="c"
                :color="c"
                :selected="form.color === c"
                @select="form.color = $event"
              />
            </div>
          </div>

          <div class="flex flex-col gap-[5px] mb-[14px]">
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
            <button class="btn-primary" @click="submit">Enregistrer</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~/types'
import { EVENT_COLORS } from '~/stores/events'
import { useTagsStore } from '~/stores/tags'

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
const addingTag = ref(false)
const newTagValue = ref('')
const tagInputRef = ref<HTMLInputElement>()
const nameRef = ref<HTMLInputElement>()

const isEditing = computed(() => !!props.initialEvent)

const form = reactive({
  name: '',
  desc: '',
  start: '',
  end: '',
  location: '',
  color: EVENT_COLORS[0],
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
      form.start = `${props.initialEvent.startDate}T${props.initialEvent.startTime}`
      form.end = `${props.initialEvent.endDate}T${props.initialEvent.endTime}`
      form.location = props.initialEvent.location ?? ''
      form.color = props.initialEvent.color
      form.tag = props.initialEvent.tag
    } else {
      form.name = ''
      form.desc = ''
      form.start = `${date}T${props.initialStartTime ?? '09:00'}`
      form.end = `${date}T${props.initialEndTime ?? '10:00'}`
      form.location = ''
      form.color = EVENT_COLORS[0]
      form.tag = tagsStore.tags[0]?.label ?? 'Perso'
    }
    await nextTick()
    nameRef.value?.focus()
  },
)

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
  if (!form.name.trim() || !form.start || !form.end) return
  const [startDate, startTimeFull] = form.start.split('T')
  const [endDate, endTimeFull] = form.end.split('T')
  emit('save', {
    name: form.name.trim(),
    desc: form.desc || undefined,
    startDate,
    startTime: startTimeFull.slice(0, 5),
    endDate,
    endTime: endTimeFull.slice(0, 5),
    location: form.location || undefined,
    color: form.color,
    tag: form.tag,
  })
  emit('update:open', false)
}
</script>
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx nuxi typecheck
```

Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add components/ui/EventModal.vue
git commit -m "feat(modal): add EventModal with create/edit form"
```

---

## Task 12: pages/timeline.vue — page complète

**Files:**
- Create: `pages/timeline.vue`

- [ ] **Step 1: Créer pages/timeline.vue**

```vue
<!-- pages/timeline.vue -->
<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <!-- Header -->
    <header class="flex items-center justify-between px-7 py-[14px] pl-6 border-b border-gray-200 flex-shrink-0">
      <div class="flex items-center gap-4">
        <span class="font-display text-[20px] font-normal tracking-[-0.3px]">Timeline</span>

        <div class="flex items-center gap-1">
          <button
            :class="[
              'px-[10px] py-[5px] text-[11px] font-medium tracking-[0.5px] border rounded-[4px] transition-all font-sans cursor-pointer',
              store.timelineMode === 'day'
                ? 'bg-black text-white border-black'
                : 'bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-black',
            ]"
            @click="setMode('day')"
          >Jour</button>
          <button
            :class="[
              'px-[10px] py-[5px] text-[11px] font-medium tracking-[0.5px] border rounded-[4px] transition-all font-sans cursor-pointer',
              store.timelineMode === 'month'
                ? 'bg-black text-white border-black'
                : 'bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-black',
            ]"
            @click="setMode('month')"
          >Mois</button>
        </div>

        <div class="flex items-center gap-[10px]">
          <button
            class="w-7 h-7 border border-gray-200 rounded-[4px] flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-black transition-all bg-transparent cursor-pointer"
            @click="navigate(-1)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-3.5 h-3.5" style="stroke-width:1.8">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span class="text-[13px] font-medium min-w-[160px] text-center">{{ dateLabel }}</span>
          <button
            class="w-7 h-7 border border-gray-200 rounded-[4px] flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-black transition-all bg-transparent cursor-pointer"
            @click="navigate(1)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-3.5 h-3.5" style="stroke-width:1.8">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <button
            class="px-3 py-[5px] text-[11px] font-medium border border-gray-200 rounded-[4px] tracking-[0.3px] text-gray-600 hover:bg-gray-50 hover:text-black transition-all bg-transparent cursor-pointer font-sans"
            @click="goToday"
          >
            Aujourd'hui
          </button>
        </div>
      </div>

      <button class="btn-primary flex items-center gap-[6px]" @click="openNewEvent">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-[13px] h-[13px]" style="stroke-width:2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Ajouter
      </button>
    </header>

    <!-- Vue Jour -->
    <div
      v-show="store.timelineMode === 'day'"
      ref="scrollRef"
      class="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
    >
      <TimelineGrid
        :current-date="store.currentDate"
        :day-events="store.dayEvents"
        @event-click="openEditEvent"
        @event-delete="(id) => store.deleteEvent(id)"
      />
    </div>

    <!-- Vue Mois -->
    <MonthCalendar
      v-show="store.timelineMode === 'month'"
      :year="calendarYear"
      :month="calendarMonth"
      :selected-date="store.currentDate"
      :events-for-date="(date) => store.eventsForDate(date)"
      @select-date="selectDateFromMonth"
    />

    <EventModal
      v-model:open="modalOpen"
      :initial-event="editingEvent ?? undefined"
      :initial-date="store.currentDate"
      :initial-start-time="newEventStart"
      :initial-end-time="newEventEnd"
      @save="saveEvent"
    />
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~/types'
import { useEventsStore } from '~/stores/events'
import { useTagsStore } from '~/stores/tags'

const store = useEventsStore()
const tagsStore = useTagsStore()
const scrollRef = ref<HTMLElement>()

const modalOpen = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)
const newEventStart = ref('09:00')
const newEventEnd = ref('10:00')

onMounted(() => {
  store.load()
  tagsStore.load()
  scrollToCurrentHour()
})

const currentDateObj = computed(() => {
  const [y, m, d] = store.currentDate.split('-').map(Number)
  return new Date(y, m - 1, d)
})

const calendarYear = computed(() => currentDateObj.value.getFullYear())
const calendarMonth = computed(() => currentDateObj.value.getMonth())

const dateLabel = computed(() => {
  const d = currentDateObj.value
  let label: string
  if (store.timelineMode === 'day') {
    label = d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  } else {
    label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }
  return label.charAt(0).toUpperCase() + label.slice(1)
})

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function navigate(dir: -1 | 1) {
  const d = new Date(currentDateObj.value)
  if (store.timelineMode === 'day') d.setDate(d.getDate() + dir)
  else d.setMonth(d.getMonth() + dir)
  store.setCurrentDate(dateKey(d))
}

function goToday() {
  store.setCurrentDate(dateKey(new Date()))
  if (store.timelineMode === 'day') nextTick(() => scrollToCurrentHour())
}

function setMode(mode: 'day' | 'month') {
  store.setTimelineMode(mode)
}

function selectDateFromMonth(date: string) {
  store.setCurrentDate(date)
  store.setTimelineMode('day')
  nextTick(() => scrollToCurrentHour())
}

function scrollToCurrentHour() {
  const todayKey = dateKey(new Date())
  if (store.currentDate !== todayKey || !scrollRef.value) return
  const HOUR_ROW_PX = 56
  scrollRef.value.scrollTop = Math.max(0, (new Date().getHours() - 1) * HOUR_ROW_PX)
}

function openNewEvent() {
  editingEvent.value = null
  newEventStart.value = '09:00'
  newEventEnd.value = '10:00'
  modalOpen.value = true
}

function openEditEvent(event: CalendarEvent) {
  editingEvent.value = event
  modalOpen.value = true
}

function saveEvent(eventData: Omit<CalendarEvent, 'id'>) {
  if (editingEvent.value) {
    store.updateEvent({ ...eventData, id: editingEvent.value.id })
  } else {
    store.addEvent(eventData)
  }
  editingEvent.value = null
}
</script>
```

- [ ] **Step 2: Vérifier dans le navigateur — parcours complet**

```bash
npm run dev
```

Ouvrir http://localhost:3000. Vérifier :

1. **Grille 24h** : labels 00:00 → 23:00 visibles, lignes des quarts d'heure présentes
2. **Heure courante** : ligne rouge à la bonne position si on est sur la date d'aujourd'hui
3. **Date label** : affiche le jour courant en français (ex: "Vendredi 6 juin 2026")
4. **Créer un événement** : clic "Ajouter" → modal s'ouvre → remplir nom + dates → "Enregistrer" → événement apparaît dans la grille à la bonne heure, avec la couleur choisie
5. **Modifier** : clic sur l'EventBar → modal pré-rempli → modifier le nom → "Enregistrer" → nom mis à jour
6. **Supprimer** : hover sur EventBar → bouton × apparaît → clic → événement disparaît
7. **Navigation** : clic `←` / `→` → date change, grille vide pour les autres jours
8. **Aujourd'hui** : clic "Aujourd'hui" → retour à la date courante
9. **Vue Mois** : clic "Mois" → calendrier mensuel affiché, événements en pills, clic sur un jour → switch en vue Jour
10. **Persistance** : reload page → événements toujours présents

Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add pages/timeline.vue
git commit -m "feat(timeline): add full interactive timeline page"
```

---

## Task 13: Matrix — composants squelettes + page

**Files:**
- Create: `components/matrix/MatrixQuadrant.vue`
- Create: `components/matrix/MatrixTaskItem.vue`
- Create: `components/matrix/MatrixNotesArea.vue`
- Create: `pages/matrix.vue`

- [ ] **Step 1: Créer components/matrix/MatrixQuadrant.vue**

```vue
<!-- components/matrix/MatrixQuadrant.vue -->
<template>
  <div class="border border-gray-200 p-3 flex flex-col overflow-hidden" :class="borderClass">
    <div class="mb-2 pb-[7px] border-b border-gray-200 flex-shrink-0">
      <div class="text-[9px] font-semibold tracking-[1px] uppercase text-black">{{ title }}</div>
      <div v-if="subtitle" class="text-[9px] text-gray-400 mt-[1px] italic">{{ subtitle }}</div>
    </div>
    <div class="flex-1 overflow-y-auto">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  borderClass?: string
}>()
</script>
```

- [ ] **Step 2: Créer components/matrix/MatrixTaskItem.vue**

```vue
<!-- components/matrix/MatrixTaskItem.vue -->
<template>
  <div class="flex items-center gap-[7px] py-[3px]">
    <input
      type="checkbox"
      :checked="done"
      class="w-[13px] h-[13px] rounded-full border-[1.5px] border-gray-200 appearance-none cursor-pointer flex-shrink-0"
    />
    <span :class="['text-[11px]', done ? 'line-through text-gray-400' : 'text-black']">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text: string; done?: boolean }>()
</script>
```

- [ ] **Step 3: Créer components/matrix/MatrixNotesArea.vue**

```vue
<!-- components/matrix/MatrixNotesArea.vue -->
<template>
  <div class="flex flex-col overflow-hidden h-full">
    <div class="section-label mb-[6px] flex-shrink-0">Notes + Ideas</div>
    <textarea
      class="w-full flex-1 resize-none border-none outline-none font-sans text-[11px] text-black leading-[1.8] bg-transparent"
      placeholder="Idées, réflexions, références..."
    />
  </div>
</template>
```

- [ ] **Step 4: Créer pages/matrix.vue**

```vue
<!-- pages/matrix.vue -->
<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <header class="flex items-center justify-between px-7 py-[14px] pl-6 border-b border-gray-200 flex-shrink-0">
      <span class="font-display text-[20px] font-normal tracking-[-0.3px]">Priority Matrix</span>
      <span class="text-xs text-gray-400">{{ dateLabel }}</span>
    </header>

    <div
      class="flex-1 grid overflow-hidden px-6 relative min-h-0"
      style="grid-template-columns: 1fr 1fr 190px; grid-template-rows: 1fr 1fr;"
    >
      <div
        class="absolute left-[2px] top-1/2 -translate-y-1/2 -rotate-90 text-[8px] tracking-[2px] uppercase text-gray-400 font-semibold whitespace-nowrap pointer-events-none select-none"
      >
        IMPORTANCE
      </div>

      <MatrixQuadrant title="Important, Not Urgent" subtitle="Décider quand faire" border-class="border-r-0 border-b-0" />
      <MatrixQuadrant title="Important & Urgent" subtitle="Faire immédiatement" border-class="border-b-0" />

      <div class="border border-gray-200 border-l-0 p-3 row-span-2 flex flex-col overflow-hidden">
        <div class="mb-2 pb-[7px] border-b border-gray-200 flex-shrink-0">
          <div class="text-[9px] font-semibold tracking-[1px] uppercase text-black">Tasks for Today</div>
        </div>
        <div class="flex-1 flex items-center justify-center text-[11px] text-gray-400 italic">
          À implémenter
        </div>
      </div>

      <MatrixQuadrant title="Not Important & Not Urgent" subtitle="Faire plus tard" border-class="border-r-0" />
      <MatrixQuadrant title="Not Important & Urgent" subtitle="Déléguer" />
    </div>

    <div class="flex items-center justify-center gap-2 text-[8px] tracking-[2px] uppercase text-gray-300 font-semibold py-1 border-t border-gray-200 flex-shrink-0">
      <span class="text-sm leading-none">−</span>
      URGENCY
      <span class="text-sm leading-none">+</span>
    </div>

    <div
      class="grid border-t border-gray-200 flex-shrink-0 h-[120px] px-6"
      style="grid-template-columns: 1fr 190px;"
    >
      <div class="border-r border-gray-200 py-[10px] px-[14px] flex flex-col overflow-hidden">
        <MatrixNotesArea />
      </div>
      <div class="py-[10px] px-[14px] flex flex-col overflow-hidden">
        <div class="mb-2 pb-[7px] border-b border-gray-200 flex-shrink-0">
          <div class="text-[9px] font-semibold tracking-[1px] uppercase text-black">Tasks for Tomorrow</div>
        </div>
        <div class="flex-1 flex items-center justify-center text-[11px] text-gray-400 italic">
          À implémenter
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const dateLabel = computed(() => {
  const label = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
})
</script>
```

- [ ] **Step 5: Vérifier dans le navigateur**

```bash
npm run dev
```

Ouvrir http://localhost:3000/matrix. Expected:
- Page Matrix affichée avec 4 quadrants, colonne tâches, barre URGENCY en bas
- Section notes + tasks for tomorrow visible en bas
- Navigation sidebar → clic Timeline → retour sur /timeline sans erreur
- Clic Matrix dans sidebar → /matrix, icône active

Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add components/matrix/ pages/matrix.vue
git commit -m "feat(matrix): add matrix page skeleton with quadrant layout"
```

---

## Task 14: Docker

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: Créer Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

- [ ] **Step 2: Créer docker-compose.yml**

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

- [ ] **Step 3: Commit**

```bash
git add Dockerfile docker-compose.yml
git commit -m "chore(docker): add dockerfile and docker-compose"
```

---

## Task 15: Vérification finale et typecheck

- [ ] **Step 1: Typecheck complet**

```bash
npx nuxi typecheck
```

Expected: `No errors found`.

- [ ] **Step 2: Build de production**

```bash
npm run build
```

Expected: build sans erreur, `.output/` généré.

- [ ] **Step 3: Vérification du build**

```bash
node .output/server/index.mjs
```

Ouvrir http://localhost:3000. Vérifier que l'app fonctionne en mode production.

Ctrl+C.

- [ ] **Step 4: Commit final si des corrections ont été nécessaires**

```bash
git add -A
git commit -m "fix(config): address typecheck and build issues"
```

(Passer cette étape si aucune correction n'a été nécessaire.)

---

## Critères de succès

- [ ] `npm run dev` démarre sans erreur TypeScript
- [ ] Sidebar : navigation Timeline ↔ Matrix, état actif correct
- [ ] Vue Jour : grille 24h, scroll, ligne heure courante rouge
- [ ] Vue Mois : calendrier 7×6, navigation mois, clic jour → vue jour
- [ ] Créer événement : modal → EventBar dans grille
- [ ] Modifier événement : clic EventBar → modal pré-rempli → sauvegarde
- [ ] Supprimer événement : hover → × → disparaît
- [ ] Persistance : reload page → événements conservés
- [ ] Matrix : page rendue sans erreur (skeleton)
- [ ] `npm run build` sans erreur
- [ ] `docker-compose up -d` démarre l'app en production
