# Responsive Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre Meridian utilisable sur mobile (< 640px) en adaptant la navigation, les headers et les layouts sans toucher au comportement desktop.

**Architecture:** Approche mobile-first avec breakpoints Tailwind (`sm:`) pour 90% des cas CSS, complétée par un composable `useBreakpoint` pour les cas où du JS conditionnel est nécessaire (Matrix). Aucune logique métier modifiée — seuls les templates et layouts changent.

**Tech Stack:** Nuxt 4, Vue 3, Tailwind CSS v3 (breakpoint `sm` = 640px)

---

## Fichiers modifiés

| Fichier | Action |
|---|---|
| `app/composables/useBreakpoint.ts` | Créer |
| `app/layouts/default.vue` | Modifier |
| `app/components/layout/AppSidebar.vue` | Modifier |
| `app/pages/timeline.vue` | Modifier |
| `app/components/ui/EventModal.vue` | Modifier |
| `app/pages/matrix.vue` | Modifier |

---

## Task 1 : Créer la branche et le composable `useBreakpoint`

**Files:**
- Create: `app/composables/useBreakpoint.ts`

- [ ] **Step 1 : Créer la branche git**

```bash
git checkout -b feat/responsive-mobile
```

- [ ] **Step 2 : Créer le composable**

Créer `app/composables/useBreakpoint.ts` avec le contenu suivant :

```ts
export function useBreakpoint() {
  const isMobile = ref(false)
  const update = () => { isMobile.value = window.innerWidth < 640 }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => window.removeEventListener('resize', update))

  return { isMobile: readonly(isMobile) }
}
```

Note : `ref`, `onMounted`, `onUnmounted`, `readonly` sont auto-importés par Nuxt — pas besoin de les importer.

- [ ] **Step 3 : Vérification manuelle**

Lancer le dev server :
```bash
npm run dev
```
Ouvrir les DevTools → onglet Console, redimensionner la fenêtre sous 640px et au-dessus. Aucune erreur ne doit apparaître.

- [ ] **Step 4 : Commit**

```bash
git add app/composables/useBreakpoint.ts
git commit -m "feat(responsive): add useBreakpoint composable"
```

---

## Task 2 : Layout responsive — sidebar → bottom nav mobile

**Files:**
- Modify: `app/components/layout/AppSidebar.vue`
- Modify: `app/layouts/default.vue`

- [ ] **Step 1 : Modifier `AppSidebar.vue`**

Remplacer tout le contenu du fichier par :

```vue
<template>
  <!-- Desktop: sidebar verticale gauche -->
  <nav class="hidden sm:flex w-[52px] h-screen flex-col items-center justify-center gap-[6px] flex-shrink-0 relative z-10">
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

  <!-- Mobile: barre fixe en bas -->
  <nav class="sm:hidden fixed bottom-0 left-0 right-0 h-14 flex items-center justify-around bg-white border-t border-gray-200 z-50">
    <button
      :class="[
        'flex flex-col items-center gap-1 p-2 transition-colors',
        route.path.startsWith('/timeline') ? 'text-black' : 'text-gray-400',
      ]"
      @click="navigateTo('/timeline')"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-[20px] h-[20px]" style="stroke-width:1.4">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <span class="text-[9px] font-semibold tracking-[0.5px] uppercase">Timeline</span>
    </button>
    <button
      :class="[
        'flex flex-col items-center gap-1 p-2 transition-colors',
        route.path.startsWith('/matrix') ? 'text-black' : 'text-gray-400',
      ]"
      @click="navigateTo('/matrix')"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-[20px] h-[20px]" style="stroke-width:1.4">
        <rect x="3" y="3" width="8" height="8" rx="1"/>
        <rect x="13" y="3" width="8" height="8" rx="1"/>
        <rect x="3" y="13" width="8" height="8" rx="1"/>
        <rect x="13" y="13" width="8" height="8" rx="1"/>
      </svg>
      <span class="text-[9px] font-semibold tracking-[0.5px] uppercase">Matrix</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
```

- [ ] **Step 2 : Modifier `default.vue`**

Remplacer tout le contenu du fichier par :

```vue
<template>
  <div class="flex w-full h-screen overflow-hidden bg-gray-50">
    <AppSidebar />
    <div class="flex-1 min-w-0 sm:border-l border-gray-200 bg-white flex flex-col h-screen overflow-hidden pb-14 sm:pb-0">
      <slot />
    </div>
  </div>
</template>
```

Changements : `sm:border-l` (pas de bordure gauche sur mobile), `pb-14 sm:pb-0` (espace pour la bottom nav mobile).

- [ ] **Step 3 : Vérification visuelle**

Dans le navigateur avec DevTools en mode mobile (< 640px) :
- La sidebar gauche est invisible
- Une barre apparaît en bas avec les icônes Timeline et Matrix
- Naviguer vers Timeline puis Matrix — l'icône active est noire, l'autre grise
- En desktop (> 640px), la sidebar gauche est intacte, la bottom nav est invisible

- [ ] **Step 4 : Commit**

```bash
git add app/components/layout/AppSidebar.vue app/layouts/default.vue
git commit -m "feat(responsive): bottom nav bar on mobile, responsive layout"
```

---

## Task 3 : Header Timeline — 2 lignes sur mobile

**Files:**
- Modify: `app/pages/timeline.vue`

- [ ] **Step 1 : Remplacer le `<header>` dans `timeline.vue`**

Localiser le bloc `<header>` (lignes 4–62 de `app/pages/timeline.vue`) et le remplacer par :

```html
<header class="border-b border-gray-200 flex-shrink-0">
  <!-- Ligne 1 : titre + bouton Ajouter -->
  <div class="flex items-center justify-between px-4 sm:px-7 sm:pl-6 pt-[14px] pb-2 sm:pb-[14px]">
    <div class="flex items-center gap-4">
      <span class="font-display text-[20px] font-normal tracking-[-0.3px]">Timeline</span>

      <!-- Toggle Jour/Mois : visible sur desktop ici, caché sur mobile -->
      <div class="hidden sm:flex items-center gap-1">
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

      <!-- Navigation date : visible sur desktop ici, caché sur mobile -->
      <div class="hidden sm:flex items-center gap-[10px]">
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
  </div>

  <!-- Ligne 2 : toggle + navigation (mobile uniquement) -->
  <div class="sm:hidden flex items-center justify-between px-4 pb-3">
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
      <span class="text-[13px] font-medium text-center">{{ dateLabel }}</span>
      <button
        class="w-7 h-7 border border-gray-200 rounded-[4px] flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-black transition-all bg-transparent cursor-pointer"
        @click="navigate(1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-3.5 h-3.5" style="stroke-width:1.8">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  </div>
</header>
```

- [ ] **Step 2 : Vérification visuelle**

En mode mobile (< 640px) :
- Ligne 1 : titre "Timeline" à gauche, bouton "Ajouter" à droite
- Ligne 2 : toggle Jour/Mois à gauche, navigation ← date → à droite
- Le bouton "Aujourd'hui" n'apparaît pas
- Naviguer entre jours et mois fonctionne normalement

En mode desktop (> 640px) :
- Header en une seule ligne, identique à l'état actuel

- [ ] **Step 3 : Commit**

```bash
git add app/pages/timeline.vue
git commit -m "feat(responsive): two-row header on mobile for Timeline"
```

---

## Task 4 : EventModal — bottom sheet sur mobile

**Files:**
- Modify: `app/components/ui/EventModal.vue`

- [ ] **Step 1 : Modifier le backdrop et le conteneur de la modale**

Dans `app/components/ui/EventModal.vue`, localiser la `<div>` avec `class="fixed inset-0 bg-black/[.18] z-[200] flex items-center justify-center"` (ligne 12) et la remplacer par :

```html
<div
  v-if="open"
  class="fixed inset-0 bg-black/[.18] z-[200] flex items-end sm:items-center sm:justify-center"
  @click.self="$emit('update:open', false)"
>
```

Puis localiser la `<div>` intérieure avec `class="bg-white border border-gray-200 rounded-md w-[440px] ..."` (ligne 17) et la remplacer par :

```html
<div
  class="bg-white sm:border sm:border-gray-200 sm:rounded-md sm:w-[440px] w-full rounded-t-2xl px-7 pt-7 pb-6 relative shadow-[0_8px_32px_rgba(0,0,0,0.1)] max-h-[90vh] overflow-y-auto sm:max-h-none sm:overflow-visible"
  style="animation: modalIn 0.15s ease"
>
```

- [ ] **Step 2 : Vérification visuelle**

En mode mobile (< 640px) :
- Cliquer sur "Ajouter" : la modale monte depuis le bas de l'écran, bords arrondis en haut
- La modale est scrollable si le contenu dépasse la hauteur de l'écran
- Cliquer en dehors ferme la modale
- La croix de fermeture fonctionne

En mode desktop (> 640px) :
- La modale s'affiche centrée comme avant

- [ ] **Step 3 : Commit**

```bash
git add app/components/ui/EventModal.vue
git commit -m "feat(responsive): EventModal as bottom sheet on mobile"
```

---

## Task 5 : Matrix — quadrants empilés sur mobile

**Files:**
- Modify: `app/pages/matrix.vue`

- [ ] **Step 1 : Remplacer tout le contenu de `matrix.vue`**

```vue
<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <header class="flex items-center justify-between px-4 sm:px-7 py-[14px] sm:pl-6 border-b border-gray-200 flex-shrink-0">
      <span class="font-display text-[20px] font-normal tracking-[-0.3px]">Priority Matrix</span>
      <span class="text-xs text-gray-400">{{ dateLabel }}</span>
    </header>

    <!-- Desktop layout -->
    <template v-if="!isMobile">
      <div class="flex-1 flex overflow-hidden min-h-0">
        <div class="w-5 flex items-center justify-center flex-shrink-0">
          <span class="-rotate-90 text-[8px] tracking-[2px] uppercase text-gray-400 font-semibold whitespace-nowrap pointer-events-none select-none">IMPORTANCE</span>
        </div>

        <div
          class="flex-1 grid overflow-hidden px-6 min-h-0"
          style="grid-template-columns: 1fr 1fr 190px; grid-template-rows: 1fr 1fr;"
        >
          <MatrixQuadrant
            title="Important, Not Urgent"
            subtitle="Décider quand faire"
            quadrant-id="inu"
            container-class="border border-gray-200 p-3 border-r-0 border-b-0"
          />
          <MatrixQuadrant
            title="Important &amp; Urgent"
            subtitle="Faire immédiatement"
            quadrant-id="iu"
            container-class="border border-gray-200 p-3 border-b-0"
          />
          <MatrixQuadrant
            title="Tasks for Today"
            quadrant-id="today"
            container-class="border border-gray-200 p-3 border-l-0 row-span-2"
          />
          <MatrixQuadrant
            title="Not Important &amp; Not Urgent"
            subtitle="Faire plus tard"
            quadrant-id="ninu"
            container-class="border border-gray-200 p-3 border-r-0"
          />
          <MatrixQuadrant
            title="Not Important &amp; Urgent"
            subtitle="Déléguer"
            quadrant-id="niu"
            container-class="border border-gray-200 p-3"
          />
        </div>
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
        <MatrixQuadrant
          title="Tasks for Tomorrow"
          quadrant-id="tomorrow"
          container-class="py-[10px] px-[14px]"
        />
      </div>
    </template>

    <!-- Mobile layout : quadrants empilés -->
    <template v-else>
      <div class="flex-1 overflow-y-auto">
        <MatrixQuadrant
          title="Important &amp; Urgent"
          subtitle="Faire immédiatement"
          quadrant-id="iu"
          container-class="p-4 border-b border-gray-200 min-h-[120px]"
        />
        <MatrixQuadrant
          title="Important, Not Urgent"
          subtitle="Décider quand faire"
          quadrant-id="inu"
          container-class="p-4 border-b border-gray-200 min-h-[120px]"
        />
        <MatrixQuadrant
          title="Not Important &amp; Urgent"
          subtitle="Déléguer"
          quadrant-id="niu"
          container-class="p-4 border-b border-gray-200 min-h-[120px]"
        />
        <MatrixQuadrant
          title="Not Important &amp; Not Urgent"
          subtitle="Faire plus tard"
          quadrant-id="ninu"
          container-class="p-4 border-b border-gray-200 min-h-[120px]"
        />
        <MatrixQuadrant
          title="Tasks for Today"
          quadrant-id="today"
          container-class="p-4 border-b border-gray-200 min-h-[120px]"
        />
        <MatrixQuadrant
          title="Tasks for Tomorrow"
          quadrant-id="tomorrow"
          container-class="p-4 border-b border-gray-200 min-h-[120px]"
        />
        <div class="p-4 min-h-[100px] flex flex-col">
          <MatrixNotesArea />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const { isMobile } = useBreakpoint()

const dateLabel = computed(() => {
  const label = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
})
</script>
```

- [ ] **Step 2 : Vérification visuelle**

En mode mobile (< 640px) :
- Les 6 quadrants + Notes s'affichent empilés verticalement
- La page est scrollable
- Ajouter une tâche dans chaque quadrant fonctionne
- Les axes IMPORTANCE/URGENCY n'apparaissent pas

En mode desktop (> 640px) :
- La grille 2×2 + colonne Today + section bas est identique à l'état actuel
- Les axes IMPORTANCE/URGENCY sont visibles

- [ ] **Step 3 : Commit**

```bash
git add app/pages/matrix.vue
git commit -m "feat(responsive): stacked quadrants layout on mobile for Matrix"
```

---

## Task 6 : Vérification finale et PR

- [ ] **Step 1 : Test complet sur mobile**

Ouvrir Chrome DevTools → mode responsive, sélectionner iPhone 14 (390px) :

- [ ] Navigation bottom bar visible, sidebar invisible
- [ ] Timeline header sur 2 lignes
- [ ] Navigation de dates fonctionne (← →)
- [ ] Basculer Jour ↔ Mois fonctionne
- [ ] Cliquer sur la grille crée un événement (modal bottom sheet)
- [ ] Modal bottom sheet scrollable si nécessaire
- [ ] Matrix : 6 quadrants + Notes empilés, tout scrollable
- [ ] Ajouter/modifier/supprimer des tâches dans la Matrix
- [ ] Naviguer Timeline ↔ Matrix via la bottom nav

- [ ] **Step 2 : Test desktop (régression)**

Passer en mode desktop (> 640px) :

- [ ] Sidebar gauche visible, bottom nav invisible
- [ ] Timeline header sur une ligne (identique à avant)
- [ ] EventModal centré (identique à avant)
- [ ] Matrix grille 2×2 intacte

- [ ] **Step 3 : Commit final si tout passe**

```bash
git add -A
git commit -m "chore(responsive): final responsive review pass"
```

- [ ] **Step 4 : Créer la PR**

```bash
gh pr create \
  --title "feat(responsive): mobile responsive layout" \
  --body "Adapts Meridian for mobile screens (< 640px).

## Changes
- Bottom nav bar replaces left sidebar on mobile
- Timeline header splits into 2 rows on mobile
- EventModal becomes a bottom sheet on mobile
- Matrix quadrants stack vertically on mobile

## Approach
Tailwind sm: breakpoints for CSS + useBreakpoint composable for JS-conditional Matrix layout. Desktop behavior unchanged." \
  --base main
```
