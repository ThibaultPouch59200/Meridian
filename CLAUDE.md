# Meridian — CLAUDE.md

Référence de projet pour Claude Code. Ce fichier définit les règles de travail, l'architecture, et les conventions à respecter dans toutes les sessions.

---

## Présentation du projet

**Meridian** est un day planner personnel composé de deux vues principales :
- **Timeline** : vue journalière (24h, subdivisée en quarts d'heure) et vue mensuelle (calendrier)
- **Matrix** : matrice de priorités Eisenhower (Important/Urgent)

La maquette de référence visuelle se trouve dans `docs/maquette.html`.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Nuxt 4 (SSR désactivé, mode SPA) |
| CSS | Tailwind CSS v3 + fichier `assets/css/main.css` pour les classes partagées |
| State | Pinia |
| Routing | Vue Router via Nuxt (pages/) |
| Persistance locale | localStorage (provisoire) |
| Persistance future | Supabase (à brancher en remplacement du localStorage) |
| Typage | TypeScript strict |
| Déploiement | Docker Compose |
| Fonts | Instrument Sans + Instrument Serif (Google Fonts) |

---

## Principes de développement

### SOLID

- **S** — Single Responsibility : chaque composant ou composable fait une seule chose. Un composant qui gère à la fois l'affichage et la logique métier doit être découpé.
- **O** — Open/Closed : les composants s'étendent par props et slots, pas par modification directe du code existant.
- **L** — Liskov : les composants enfants respectent le contrat de leur parent (props requises, events émis correctement).
- **I** — Interface Segregation : les composables exposent uniquement ce dont le consommateur a besoin, pas un objet global fourre-tout.
- **D** — Dependency Inversion : la logique métier (stores Pinia) ne dépend pas des composants UI. Les composants consomment les stores, jamais l'inverse.

### KISS

- Pas de sur-ingénierie. Si une solution simple marche, on ne la remplace pas par une solution complexe.
- Pas d'abstraction prématurée : on duplique une fois, on abstrait à la deuxième duplication.
- Les composables (`composables/`) encapsulent la logique réutilisable, pas les composants.

### Composants Vue

- **Découpage maximal** : tout élément répété ou toute section logique indépendante devient un composant.
- Un composant = un fichier `.vue` = une responsabilité claire.
- Nommage en PascalCase, préfixé par domaine : `EventBar.vue`, `EventModal.vue`, `TimelineGrid.vue`, `MonthCalendar.vue`, `MatrixQuadrant.vue`, etc.
- Les composants ne contiennent pas de logique métier directe : ils délèguent aux composables et stores.
- Props explicitement typées avec `defineProps<{}>()`, events avec `defineEmits<{}>()`.

---

## Conventions de commit (Conventional Commits)

Format obligatoire :

```
<type>(<scope>): <description courte en français ou anglais>

[body optionnel]

[footer optionnel: BREAKING CHANGE, closes #issue]
```

### Types autorisés

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `style` | Changement CSS/visuel sans logique |
| `refactor` | Restructuration sans changement de comportement |
| `chore` | Config, dépendances, tooling |
| `docs` | Documentation uniquement |
| `test` | Ajout ou modification de tests |
| `perf` | Amélioration de performance |

### Scopes principaux

`timeline`, `matrix`, `events`, `modal`, `sidebar`, `store`, `router`, `docker`, `config`

### Exemples valides

```
feat(timeline): add drag-select to create events on day view
fix(modal): prevent form submission when name field is empty
style(sidebar): reduce icon size on narrow screens
refactor(events): extract useEventStore composable from TimelineView
chore(docker): add nginx reverse proxy to compose file
```

---

## Architecture des fichiers

Le projet utilise **Nuxt 4** avec la structure `app/` (srcDir par défaut). Tous les fichiers Vue, composables, stores et layouts sont dans `app/`. Les fichiers de configuration restent à la racine.

```
meridian/
├── app/                      # srcDir Nuxt 4 — tout le code Vue ici
│   ├── assets/
│   │   └── css/
│   │       └── main.css      # Classes Tailwind partagées et custom
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppSidebar.vue
│   │   ├── timeline/
│   │   │   ├── TimelineGrid.vue
│   │   │   ├── TimelineHourRow.vue
│   │   │   ├── EventBar.vue
│   │   │   ├── CurrentTimeLine.vue
│   │   │   └── MonthCalendar.vue
│   │   ├── matrix/
│   │   │   ├── MatrixQuadrant.vue
│   │   │   ├── MatrixTaskItem.vue
│   │   │   └── MatrixNotesArea.vue
│   │   └── ui/
│   │       ├── EventModal.vue
│   │       ├── ColorSwatch.vue
│   │       ├── TagChip.vue
│   │       └── IconButton.vue
│   ├── composables/
│   │   ├── useEvents.ts
│   │   ├── useDragSelect.ts
│   │   └── useCurrentTime.ts
│   ├── stores/
│   │   ├── events.ts
│   │   ├── matrix.ts
│   │   └── tags.ts
│   ├── pages/
│   │   ├── index.vue         # Redirige vers /timeline
│   │   ├── timeline.vue
│   │   └── matrix.vue
│   ├── layouts/
│   │   └── default.vue       # Layout avec AppSidebar
│   └── app.vue               # Entrée Nuxt 4
├── types/
│   └── index.ts              # Interfaces Event, Task, Tag...
├── docs/
│   └── maquette.html         # Maquette HTML de référence visuelle
├── docker-compose.yml
├── Dockerfile
├── nuxt.config.ts
├── tailwind.config.ts
└── CLAUDE.md
```

---

## CSS — règles Tailwind

- Les classes Tailwind s'utilisent directement dans les templates `.vue`.
- **Si une combinaison de classes est utilisée plus d'une fois dans le projet**, elle est extraite dans `app/assets/css/main.css` avec `@apply` :

```css
/* app/assets/css/main.css */
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
}
```

- Pas de styles inline (`style=""`) sauf pour les couleurs dynamiques issues des données (couleur d'événement).
- Pas de fichiers CSS par composant sauf exception justifiée.

---

## Design tokens (à reproduire fidèlement)

```ts
// tailwind.config.ts
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

---

## Docker

Le projet se déploie avec `docker-compose up -d`.

```yaml
# docker-compose.yml (structure cible)
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

```dockerfile
# Dockerfile (structure cible)
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

---

## Types principaux

```ts
// types/index.ts
export interface CalendarEvent {
  id: string
  name: string
  desc?: string
  startDate: string   // YYYY-MM-DD
  startTime: string   // HH:MM
  endDate: string
  endTime: string
  location?: string
  color: string       // hex
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

---

## Ce que Claude Code ne doit pas faire

- Ne pas mettre de logique métier dans les composants de présentation.
- Ne pas créer de fichier CSS par composant si Tailwind suffit.
- Ne pas utiliser `any` en TypeScript.
- Ne pas faire de commits sans respecter le format Conventional Commits.
- Ne pas modifier `CLAUDE.md` sans instruction explicite.
