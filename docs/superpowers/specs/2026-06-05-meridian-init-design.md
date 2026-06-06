# Meridian — Design Spec : Initialisation Nuxt 3 (Jalon 1)

**Date :** 2026-06-05  
**Scope :** Scaffold complet + Timeline interactive + Matrix squelette  
**Branche :** `feat/init-nuxt-scaffold` (jamais sur `main`)

---

## 1. Scaffold & Configuration

**Méthode :** `npx nuxi@latest init` dans le répertoire existant, puis adaptation.

**Dépendances à installer :**
- `@nuxtjs/tailwindcss`
- `@pinia/nuxt` + `pinia`
- `@nuxtjs/google-fonts` (Instrument Sans, Instrument Serif)

**`nuxt.config.ts` :**
- `ssr: false` (mode SPA)
- modules : tailwindcss, pinia, google-fonts
- `css: ['~/assets/css/main.css']`
- `app.head` avec meta viewport

**Fichiers par défaut Nuxt à supprimer :** composants Welcome, page app.vue par défaut si générée.

---

## 2. Design Tokens — `tailwind.config.ts`

```ts
colors: {
  black: '#0d0d0d',
  'gray-900': '#1a1a1a',
  'gray-600': '#666666',
  'gray-400': '#aaaaaa',
  'gray-200': '#dddddd',
  'gray-100': '#f0f0ee',
  'gray-50':  '#f8f8f6',
}
fontFamily: {
  sans:    ['Instrument Sans', 'sans-serif'],
  display: ['Instrument Serif', 'serif'],
}
```

**Couleurs d'événements** (`#4a90d9`, `#e05555`, etc.) : constante dans `stores/events.ts`, appliquées via `style=""` inline uniquement (dynamiques, pas de classe Tailwind).

**`assets/css/main.css` :**
- `@tailwind base/components/utilities`
- `.btn-primary`, `.section-label`, `.event-bar` via `@apply`
- Styles scrollbar webkit (width 4px, thumb gray-200)

---

## 3. Types — `types/index.ts`

```ts
CalendarEvent { id, name, desc?, startDate, startTime, endDate, endTime, location?, color, tag }
Task          { id, text, done }
Tag           { label, builtIn }
QuadrantId    = 'inu' | 'iu' | 'ninu' | 'niu' | 'today' | 'tomorrow'
```

---

## 4. Stores Pinia

**`stores/events.ts`**
- State : `events: CalendarEvent[]`, `currentDate: string (YYYY-MM-DD)`, `timelineMode: 'day' | 'month'`
- Constante : `EVENT_COLORS`, `EVENT_COLOR_BG` (mapping couleur → fond translucide)
- Actions : `addEvent`, `updateEvent`, `deleteEvent`, `setCurrentDate`, `setTimelineMode`
- Persistance : `localStorage` clé `meridian_events_v1`

**`stores/tags.ts`**
- State : `tags: Tag[]` — défaut `['Perso', 'Travail']` (builtIn: true)
- Actions : `addTag`
- Persistance : `localStorage` clé `meridian_tags_v1`

**`stores/matrix.ts`** — stub vide pour ce jalon (state + actions à implémenter au jalon 2)

---

## 5. Composables

**`composables/useCurrentTime.ts`**
- Retourne `now: Ref<Date>` mis à jour chaque minute
- `onUnmounted` nettoie l'interval

**`composables/useEvents.ts`**
- Retourne `dayEvents: ComputedRef<CalendarEvent[]>` — events du `currentDate` du store
- Retourne `eventsForDate(date: string): CalendarEvent[]`

**`composables/useDragSelect.ts`** — stub, export vide, implémentation au jalon 2

---

## 6. Layout — `layouts/default.vue`

- Flex row : `AppSidebar` (52px fixe) + `<slot>` (flex-1)
- Google Fonts déjà chargées via module Nuxt

**`components/layout/AppSidebar.vue`**
- Largeur 52px, hauteur 100vh, centré verticalement
- 2 `IconButton` : Timeline (`/timeline`) et Matrix (`/matrix`)
- État actif via `useRoute().path`
- Ligne décorative verticale via pseudo-élément (::before, 1px, 140px hauteur)
- Icônes SVG inline (calendrier et grille 2×2)

---

## 7. Timeline — Composants

### `components/ui/IconButton.vue`
Props : `title: string`, `active?: boolean`  
Slot default pour le SVG. Émet `click`. Style : 36×36px, rounded-lg, hover bg-gray-100, active bg-white shadow.

### `components/ui/ColorSwatch.vue`
Props : `color: string`, `selected: boolean`. Émet `select`. Cercle 22px, border-black quand selected.

### `components/ui/TagChip.vue`
Props : `label: string`, `selected: boolean`. Émet `select`. Style pill, selected = bg-black text-white.

### `components/timeline/CurrentTimeLine.vue`
Props : `currentDate: string`. Calcule `top` en pourcentage depuis minuit (rowHeight × totalMinutes / 60). Rouge #e05555. Visible uniquement si `currentDate === today`. Se met à jour via `useCurrentTime`.

### `components/timeline/EventBar.vue`
Props : `event: CalendarEvent`.  
Émet : `click`, `delete`.  
Style : background translucide de la couleur, border-left 3px couleur pleine.  
Affiche : heure début–fin, nom, tag (si présent), bouton ×  (visible au hover).

### `components/timeline/TimelineHourRow.vue`
Props : `hour: number`, `events: CalendarEvent[]`.  
Affiche : label "HH:00" (64px), 4 quarter-lines, `EventBar` pour chaque event dont `startTime` commence dans cette heure.  
Émet : `event-click(event)`, `event-delete(id)`.

### `components/timeline/TimelineGrid.vue`
- Boucle sur heures 0–23 → `TimelineHourRow`
- Positionne `CurrentTimeLine` en absolu sur le container scroll
- Émet : `event-click(event)`, `event-delete(id)`, `slot-click({ hour, date })` (pour la création via clic simple — drag-select en jalon 2)

### `components/timeline/MonthCalendar.vue`
- Grid 7×6, header jours (Lun→Dim)
- Cellule : numéro du jour, pills d'événements (max 3), style today/selected/other-month
- Émet : `select-date(dateString)`

### `components/ui/EventModal.vue`
Props : `open: boolean`, `initialEvent?: CalendarEvent`, `initialDate?: string`, `initialStartTime?: string`, `initialEndTime?: string`.  
Émet : `update:open`, `save(event: Omit<CalendarEvent, 'id'>)`.  
Contient : champs nom, description, début/fin (datetime-local), lieu, `ColorSwatch` × 8, `TagChip` × N + bouton "+ Tag".  
Animation : `opacity 0 → 1 + translateY(6px → 0)` à l'ouverture.

---

## 8. Pages

### `pages/index.vue`
`navigateTo('/timeline')` dans `setup`.

### `pages/timeline.vue`
- Header : titre "Timeline", switch Jour/Mois, navigation ← date →, bouton Aujourd'hui, bouton "+ Ajouter"
- Vue Jour : `TimelineGrid` dans un div scrollable (overflow-y: auto, scrollbar 4px)
- Vue Mois : `MonthCalendar`
- `EventModal` en overlay (v-model:open)
- Sur `event-click` → ouvre modal en mode édition
- Sur `event-delete` → `eventsStore.deleteEvent(id)` + re-render
- Sur `save` modal → `eventsStore.addEvent` ou `updateEvent` selon mode
- Auto-scroll vers l'heure courante au montage (jour courant uniquement)

### `pages/matrix.vue`
Template HTML fidèle à la maquette : 4 quadrants, colonne tâches du jour, barre d'axe, notes + tâches demain. Sans logique (pas de store). Placeholder pour jalon 2.

---

## 9. Docker

**`Dockerfile`** — build multi-stage : `node:20-alpine` builder (`npm ci` + `npm run build`) → image finale copie `.output`.

**`docker-compose.yml`** — service `app`, port 3000:3000, `NODE_ENV=production`, restart unless-stopped.

---

## 10. Workflow Git

1. `git checkout -b feat/init-nuxt-scaffold` — avant toute création de fichier
2. Commits groupés par périmètre :
   - `chore(config): scaffold nuxt 3 spa with tailwind and pinia`
   - `chore(config): configure tailwind tokens and main.css`
   - `feat(types): add core typescript interfaces`
   - `feat(store): add events and tags pinia stores`
   - `feat(timeline): add timeline page with grid and event modal`
   - `feat(matrix): add matrix page skeleton`
   - `chore(docker): add dockerfile and docker-compose`
3. PR vers `main` uniquement quand le jalon est terminé et testé

---

## Critères de succès

- [ ] `npm run dev` démarre sans erreur TypeScript
- [ ] Navigation Timeline ↔ Matrix via sidebar fonctionne
- [ ] Vue Jour : grille 24h visible, scroll smooth, heure courante affichée en rouge
- [ ] Vue Mois : calendrier mensuel, navigation mois, clic → switch vue Jour
- [ ] Créer un événement via "Ajouter" → apparaît dans la grille
- [ ] Modifier un événement via clic sur EventBar → modal pré-rempli
- [ ] Supprimer un événement via bouton × → disparaît
- [ ] Persistance localStorage : événements survivent au reload
- [ ] Matrix page : rendue sans erreur (skeleton)
- [ ] `docker-compose up -d` démarre l'app
