# Dark Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Light / System / Dark theme toggle to Meridian, persisted in localStorage, defaulting to the OS preference.

**Architecture:** A Pinia store (`stores/theme.ts`) manages the theme state, applies the `.dark` class to `<html>`, and listens for OS changes. Tailwind's `darkMode: 'class'` strategy is enabled. Every component gets explicit `dark:` Tailwind classes alongside existing light classes. The toggle UI lives in the Settings page.

**Tech Stack:** Nuxt 4 SPA, Tailwind CSS v3 (`darkMode: 'class'`), Pinia, TypeScript

---

## File Map

| File | Change |
|---|---|
| `stores/theme.ts` | **New** — theme store |
| `tailwind.config.ts` | Add `darkMode: 'class'` |
| `app/app.vue` | Call `themeStore.init()` on mount |
| `app/assets/css/main.css` | Dark overrides for utility classes |
| `app/layouts/default.vue` | Dark bg + text base |
| `app/layouts/auth.vue` | Dark bg |
| `app/components/layout/AppSidebar.vue` | Dark mobile nav |
| `app/components/ui/IconButton.vue` | Dark active/hover states |
| `app/pages/timeline.vue` | Dark header/nav |
| `app/components/timeline/TimelineHourRow.vue` | Dark borders |
| `app/components/timeline/TimelineGrid.vue` | Dark drag preview |
| `app/components/timeline/TimelineToggle.vue` | Dark active/inactive states |
| `app/components/timeline/MonthCalendar.vue` | Dark grid + cells |
| `app/components/timeline/EventBar.vue` | (minimal — event colors are dynamic) |
| `app/components/ui/EventModal.vue` | Dark card + inputs + buttons |
| `app/components/ui/TagChip.vue` | Dark active/inactive states |
| `app/components/ui/ColorSwatch.vue` | Dark selected border |
| `app/pages/matrix.vue` | Dark borders + labels |
| `app/components/matrix/MatrixQuadrant.vue` | Dark divider + text |
| `app/components/matrix/MatrixTaskItem.vue` | Dark text + input |
| `app/components/matrix/MatrixNotesArea.vue` | Dark textarea text |
| `app/pages/login.vue` | Dark input + title |
| `app/pages/settings.vue` | Add theme toggle + dark classes |

---

## Task 1: Theme store + Tailwind config + app.vue

**Files:**
- Create: `stores/theme.ts`
- Modify: `tailwind.config.ts`
- Modify: `app/app.vue`

- [ ] **Step 1: Create `stores/theme.ts`**

```ts
// stores/theme.ts
import { defineStore } from 'pinia'

type Theme = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('system')

  function resolveTheme(): 'light' | 'dark' {
    if (theme.value === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme.value
  }

  function applyTheme() {
    if (resolveTheme() === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function setTheme(t: Theme) {
    theme.value = t
    localStorage.setItem('meridian-theme', t)
    applyTheme()
  }

  function init() {
    const stored = localStorage.getItem('meridian-theme') as Theme | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      theme.value = stored
    }
    applyTheme()
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'system') applyTheme()
    })
  }

  return { theme, setTheme, init }
})
```

- [ ] **Step 2: Add `darkMode: 'class'` to `tailwind.config.ts`**

Replace the entire file with:

```ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/components/**/*.{js,vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
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
        'gray-50':  '#f8f8f6',
      },
      fontFamily: {
        sans:    ['Instrument Sans', 'sans-serif'],
        display: ['Instrument Serif', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 3: Update `app/app.vue` to initialize the theme store**

Replace the entire file with:

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useThemeStore } from '~/stores/theme'

const themeStore = useThemeStore()
onMounted(() => themeStore.init())
</script>
```

- [ ] **Step 4: Commit**

```bash
git add stores/theme.ts tailwind.config.ts app/app.vue
git commit -m "feat(dark-theme): add theme store and enable Tailwind darkMode class"
```

---

## Task 2: CSS utility class dark overrides

**Files:**
- Modify: `app/assets/css/main.css`

- [ ] **Step 1: Replace `app/assets/css/main.css` with the following**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-black text-white text-xs font-medium rounded tracking-wide transition-opacity hover:opacity-80;
    @apply dark:bg-[#f0f0ee] dark:text-[#0d0d0d];
  }

  .section-label {
    @apply text-[9px] font-semibold tracking-[2px] uppercase text-gray-400;
  }

  .event-bar {
    @apply flex items-center gap-2 px-3 py-1.5 rounded-sm border-l-[3px] cursor-pointer transition-all hover:translate-x-px;
  }

  .form-input {
    @apply w-full font-sans text-[13px] border border-gray-200 rounded-[3px] px-[10px] py-[7px] outline-none text-black bg-white transition-colors duration-150 focus:border-black;
    @apply dark:bg-[#1a1a1a] dark:border-[#2e2e2e] dark:text-[#f0f0ee] dark:focus:border-[#f0f0ee] dark:placeholder:text-[#555555];
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
  .dark .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #333333;
  }

  .matrix-checkbox {
    @apply w-[13px] h-[13px] rounded-full border-[1.5px] border-gray-200 appearance-none cursor-pointer flex-shrink-0 relative;
    @apply dark:border-[#444444];
  }
  .matrix-checkbox:checked {
    background: #0d0d0d;
    border-color: #0d0d0d;
  }
  .dark .matrix-checkbox:checked {
    background: #f0f0ee;
    border-color: #f0f0ee;
  }
  .matrix-checkbox:checked::after {
    content: '';
    position: absolute;
    left: 2.5px;
    top: 0.5px;
    width: 4px;
    height: 7px;
    border: 1.5px solid white;
    border-top: none;
    border-left: none;
    transform: rotate(45deg);
  }
  .dark .matrix-checkbox:checked::after {
    border-color: #0d0d0d;
  }
}

@keyframes modalIn {
  from { opacity: 0; transform: translateY(6px) scale(0.99); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/assets/css/main.css
git commit -m "style(dark-theme): add dark overrides for utility classes in main.css"
```

---

## Task 3: Layouts

**Files:**
- Modify: `app/layouts/default.vue`
- Modify: `app/layouts/auth.vue`

- [ ] **Step 1: Update `app/layouts/default.vue`**

Replace the template block with:

```vue
<template>
  <div class="flex w-full h-screen overflow-hidden bg-gray-50 dark:bg-[#111111]">
    <AppSidebar />
    <div class="flex-1 min-w-0 sm:border-l border-gray-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] flex flex-col h-screen overflow-hidden pb-14 sm:pb-0 text-black dark:text-[#f0f0ee]">
      <slot />
    </div>
  </div>
</template>
```

- [ ] **Step 2: Update `app/layouts/auth.vue`**

Replace the entire file with:

```vue
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#111111] flex items-center justify-center">
    <slot />
  </div>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add app/layouts/default.vue app/layouts/auth.vue
git commit -m "style(dark-theme): add dark backgrounds to layouts"
```

---

## Task 4: Sidebar + IconButton

**Files:**
- Modify: `app/components/layout/AppSidebar.vue`
- Modify: `app/components/ui/IconButton.vue`

- [ ] **Step 1: Update `app/components/layout/AppSidebar.vue`**

Replace the entire file with:

```vue
<template>
  <!-- Desktop: sidebar verticale gauche -->
  <nav class="hidden sm:flex w-[52px] h-screen flex-col items-center justify-center gap-[6px] flex-shrink-0 relative z-10">
    <div
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-[140px] bg-gray-200 dark:bg-[#2e2e2e] pointer-events-none"
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
  <nav class="sm:hidden fixed bottom-0 left-0 right-0 h-14 flex items-center justify-around bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-[#2e2e2e] z-50">
    <button
      :class="[
        'flex flex-col items-center gap-1 p-2 transition-colors',
        route.path.startsWith('/timeline') ? 'text-black dark:text-[#f0f0ee]' : 'text-gray-400',
      ]"
      @click="navigateTo('/timeline')"
    >
      <IconTimeline />
      <span class="text-[9px] font-semibold tracking-[0.5px] uppercase">Timeline</span>
    </button>
    <button
      :class="[
        'flex flex-col items-center gap-1 p-2 transition-colors',
        route.path.startsWith('/matrix') ? 'text-black dark:text-[#f0f0ee]' : 'text-gray-400',
      ]"
      @click="navigateTo('/matrix')"
    >
      <IconMatrix />
      <span class="text-[9px] font-semibold tracking-[0.5px] uppercase">Matrix</span>
    </button>
    <button
      :class="[
        'flex flex-col items-center gap-1 p-2 transition-colors',
        route.path.startsWith('/settings') ? 'text-black dark:text-[#f0f0ee]' : 'text-gray-400',
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

- [ ] **Step 2: Update `app/components/ui/IconButton.vue`**

Replace the entire file with:

```vue
<template>
  <button
    :title="title"
    :class="[
      'w-9 h-9 flex items-center justify-center rounded-lg border-none transition-colors duration-150 cursor-pointer',
      active
        ? 'bg-white text-black shadow-sm dark:bg-[#2e2e2e] dark:text-[#f0f0ee]'
        : 'bg-transparent text-gray-400 hover:bg-gray-100 hover:text-black dark:hover:bg-[#252525] dark:hover:text-[#f0f0ee]',
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

- [ ] **Step 3: Commit**

```bash
git add app/components/layout/AppSidebar.vue app/components/ui/IconButton.vue
git commit -m "style(dark-theme): dark mode for sidebar and icon buttons"
```

---

## Task 5: Timeline page

**Files:**
- Modify: `app/pages/timeline.vue`

- [ ] **Step 1: Update the template section of `app/pages/timeline.vue`**

Replace the `<template>` block (lines 1–148) with:

```vue
<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <!-- Header -->
    <header class="border-b border-gray-200 dark:border-[#2e2e2e] flex-shrink-0">
      <!-- Ligne 1 : titre + bouton Ajouter -->
      <div class="flex items-center justify-between px-4 sm:px-7 sm:pl-6 pt-[14px] pb-2 sm:pb-[14px]">
        <div class="flex items-center gap-4">
          <span class="font-display text-[20px] font-normal tracking-[-0.3px]">Timeline</span>

          <!-- Toggle Jour/Mois : visible sur desktop ici, caché sur mobile -->
          <div class="hidden sm:block">
            <TimelineToggle />
          </div>

          <!-- Navigation date : visible sur desktop ici, caché sur mobile -->
          <div class="hidden sm:flex items-center gap-[10px]">
            <button
              class="w-7 h-7 border border-gray-200 dark:border-[#2e2e2e] rounded-[4px] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] hover:text-black dark:hover:text-[#f0f0ee] transition-all bg-transparent cursor-pointer"
              @click="navigate(-1)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-3.5 h-3.5" style="stroke-width:1.8">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span class="text-[13px] font-medium min-w-[160px] text-center">{{ dateLabel }}</span>
            <button
              class="w-7 h-7 border border-gray-200 dark:border-[#2e2e2e] rounded-[4px] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] hover:text-black dark:hover:text-[#f0f0ee] transition-all bg-transparent cursor-pointer"
              @click="navigate(1)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-3.5 h-3.5" style="stroke-width:1.8">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
            <button
              class="px-3 py-[5px] text-[11px] font-medium border border-gray-200 dark:border-[#2e2e2e] rounded-[4px] tracking-[0.3px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] hover:text-black dark:hover:text-[#f0f0ee] transition-all bg-transparent cursor-pointer font-sans"
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
        <TimelineToggle />
        <div class="flex items-center gap-[10px]">
          <button
            class="w-7 h-7 border border-gray-200 dark:border-[#2e2e2e] rounded-[4px] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] hover:text-black dark:hover:text-[#f0f0ee] transition-all bg-transparent cursor-pointer"
            @click="navigate(-1)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-3.5 h-3.5" style="stroke-width:1.8">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span class="text-[13px] font-medium min-w-[120px] text-center">{{ dateLabel }}</span>
          <button
            class="w-7 h-7 border border-gray-200 dark:border-[#2e2e2e] rounded-[4px] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] hover:text-black dark:hover:text-[#f0f0ee] transition-all bg-transparent cursor-pointer"
            @click="navigate(1)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-3.5 h-3.5" style="stroke-width:1.8">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- All-day / multi-day band (day view only) -->
    <div
      v-if="store.timelineMode === 'day' && store.allDayEvents.length"
      class="flex-shrink-0 border-b border-gray-200 dark:border-[#2e2e2e] px-6 py-2 flex flex-col gap-[3px]"
    >
      <div
        v-for="event in store.allDayEvents"
        :key="event.id"
        class="flex items-center gap-2 px-3 py-[5px] rounded-sm border-l-[3px] text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity"
        :style="{ backgroundColor: colorBg(event.color), color: event.color, borderLeftColor: event.color }"
        @click="openEditEvent(event)"
      >
        <span v-if="event.startDate !== event.endDate" class="opacity-60 tabular-nums whitespace-nowrap text-[9px]">
          {{ formatDateShort(event.startDate) }} → {{ formatDateShort(event.endDate) }}
        </span>
        <span
          class="text-[8px] font-bold flex-shrink-0 px-[4px] py-[1px] rounded-[2px] leading-tight"
          :style="{ background: 'currentColor' }"
        >
          <span style="color: white">{{ event.source === 'google' ? 'G' : 'M' }}</span>
        </span>
        <span class="flex-1 truncate">{{ event.name }}</span>
        <span
          v-if="event.tag"
          class="text-[9px] font-semibold tracking-[0.8px] uppercase opacity-65 px-[6px] py-[2px] rounded-[2px] bg-white/35 flex-shrink-0"
        >{{ event.tag }}</span>
        <button
          class="w-4 h-4 flex items-center justify-center rounded-[2px] bg-white/35 opacity-0 hover:opacity-100 transition-opacity flex-shrink-0 border-none cursor-pointer"
          style="color: inherit"
          @click.stop="store.deleteEvent(event.id)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-[10px] h-[10px]" style="stroke-width:2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Day View -->
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
        @create="openNewEventAtTime"
      />
    </div>

    <!-- Month View -->
    <MonthCalendar
      v-show="store.timelineMode === 'month'"
      :year="calendarYear"
      :month="calendarMonth"
      :selected-date="store.currentDate"
      :events-for-date="(date: string) => store.eventsForDate(date)"
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
```

- [ ] **Step 2: Commit**

```bash
git add app/pages/timeline.vue
git commit -m "style(dark-theme): dark mode for timeline page header"
```

---

## Task 6: Timeline components

**Files:**
- Modify: `app/components/timeline/TimelineHourRow.vue`
- Modify: `app/components/timeline/TimelineGrid.vue`
- Modify: `app/components/timeline/TimelineToggle.vue`

- [ ] **Step 1: Update `app/components/timeline/TimelineHourRow.vue`**

Replace the entire file with:

```vue
<template>
  <div
    class="flex items-stretch border-b border-gray-100 dark:border-[#252525]"
    :style="`height: ${HOUR_ROW_PX}px`"
    :data-hour="hour"
  >
    <div class="w-16 flex-shrink-0 pt-2 pl-6 pr-4 text-[11px] font-medium text-gray-400 tracking-[0.3px] tabular-nums select-none pointer-events-none">
      {{ label }}
    </div>
    <div class="flex-1 relative pointer-events-none">
      <div class="absolute inset-0 flex flex-col">
        <div v-for="q in 4" :key="q" class="flex-1 border-b border-gray-100/50 dark:border-[#252525]/50 last:border-b-0" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HOUR_ROW_PX } from '~/utils/timeline'

const props = defineProps<{ hour: number }>()
const label = computed(() => String(props.hour).padStart(2, '0') + ':00')
</script>
```

- [ ] **Step 2: Update `app/components/timeline/TimelineGrid.vue`**

In the drag preview `<div>` (the `v-if="isDragging"` element), replace:

```
class="absolute left-2 right-4 rounded border border-blue-300 bg-blue-50/60 pointer-events-none"
```

with:

```
class="absolute left-2 right-4 rounded border border-blue-300 dark:border-blue-400 bg-blue-50/60 dark:bg-blue-900/30 pointer-events-none"
```

- [ ] **Step 3: Update `app/components/timeline/TimelineToggle.vue`**

Replace the entire file with:

```vue
<template>
  <div class="flex items-center gap-1">
    <button
      :class="[
        'px-[10px] py-[5px] text-[11px] font-medium tracking-[0.5px] border rounded-[4px] transition-all font-sans cursor-pointer',
        store.timelineMode === 'day'
          ? 'bg-black text-white border-black dark:bg-[#f0f0ee] dark:text-[#0d0d0d] dark:border-[#f0f0ee]'
          : 'bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-black dark:text-gray-400 dark:border-[#2e2e2e] dark:hover:bg-[#252525] dark:hover:text-[#f0f0ee]',
      ]"
      @click="store.setTimelineMode('day')"
    >Jour</button>
    <button
      :class="[
        'px-[10px] py-[5px] text-[11px] font-medium tracking-[0.5px] border rounded-[4px] transition-all font-sans cursor-pointer',
        store.timelineMode === 'month'
          ? 'bg-black text-white border-black dark:bg-[#f0f0ee] dark:text-[#0d0d0d] dark:border-[#f0f0ee]'
          : 'bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-black dark:text-gray-400 dark:border-[#2e2e2e] dark:hover:bg-[#252525] dark:hover:text-[#f0f0ee]',
      ]"
      @click="store.setTimelineMode('month')"
    >Mois</button>
  </div>
</template>

<script setup lang="ts">
const store = useEventsStore()
</script>
```

- [ ] **Step 4: Commit**

```bash
git add app/components/timeline/TimelineHourRow.vue app/components/timeline/TimelineGrid.vue app/components/timeline/TimelineToggle.vue
git commit -m "style(dark-theme): dark mode for timeline components"
```

---

## Task 7: MonthCalendar

**Files:**
- Modify: `app/components/timeline/MonthCalendar.vue`

- [ ] **Step 1: Replace the `<template>` block of `app/components/timeline/MonthCalendar.vue`**

```vue
<template>
  <div class="flex-1 flex flex-col overflow-hidden p-5 gap-3 min-h-0">
    <!-- Weekday headers -->
    <div class="grid grid-cols-7">
      <div
        v-for="day in weekdays"
        :key="day"
        class="text-center text-[10px] font-semibold tracking-[1px] uppercase text-gray-400 py-1.5"
      >
        {{ day }}
      </div>
    </div>
    <!-- Days grid -->
    <div
      class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-[#2e2e2e] border border-gray-200 dark:border-[#2e2e2e] overflow-hidden flex-1"
      style="grid-template-rows: repeat(6, 1fr)"
    >
      <div
        v-for="cell in cells"
        :key="cell.key"
        :class="[
          'bg-white dark:bg-[#1a1a1a] p-2 cursor-pointer flex flex-col gap-[3px] overflow-hidden transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-[#252525]',
          !cell.currentMonth && 'bg-gray-50 dark:bg-[#161616]',
          cell.isSelected && 'outline outline-2 -outline-offset-2 outline-black dark:outline-[#f0f0ee]',
        ]"
        @click="$emit('select-date', cell.key)"
      >
        <div
          :class="[
            'text-xs font-medium leading-[22px]',
            !cell.currentMonth && 'text-gray-400',
            cell.isToday
              ? 'bg-black dark:bg-[#f0f0ee] text-white dark:text-[#0d0d0d] w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-semibold'
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
```

- [ ] **Step 2: Commit**

```bash
git add app/components/timeline/MonthCalendar.vue
git commit -m "style(dark-theme): dark mode for month calendar"
```

---

## Task 8: EventModal + TagChip + ColorSwatch

**Files:**
- Modify: `app/components/ui/EventModal.vue`
- Modify: `app/components/ui/TagChip.vue`
- Modify: `app/components/ui/ColorSwatch.vue`

- [ ] **Step 1: Update `app/components/ui/EventModal.vue`**

Replace the `<template>` block with:

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
          class="bg-white dark:bg-[#222222] sm:border sm:border-gray-200 dark:sm:border-[#3a3a3a] sm:rounded-md sm:w-[440px] w-full rounded-t-2xl px-7 pt-7 pb-6 relative shadow-[0_8px_32px_rgba(0,0,0,0.1)] max-h-[90vh] overflow-y-auto sm:max-h-none sm:overflow-visible"
          style="animation: modalIn 0.15s ease"
        >
          <button
            class="absolute top-4 right-4 w-[26px] h-[26px] border border-gray-200 dark:border-[#2e2e2e] rounded flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-[#f0f0ee] hover:bg-gray-50 dark:hover:bg-[#2e2e2e] transition-all bg-transparent cursor-pointer"
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
            <span class="text-[10px] text-gray-400 font-medium">
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
            <label for="allDay" class="text-[11px] font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none">
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
                  class="px-[10px] py-1 rounded-[3px] text-[10px] font-semibold tracking-[0.5px] border border-dashed border-gray-200 dark:border-[#2e2e2e] text-gray-400 hover:text-black dark:hover:text-[#f0f0ee] hover:border-black dark:hover:border-[#f0f0ee] transition-all font-sans bg-transparent cursor-pointer"
                  @click="startAddTag"
                >
                  + Tag
                </button>
              </template>
              <template v-else>
                <input
                  ref="tagInputRef"
                  v-model="newTagValue"
                  class="border border-dashed border-gray-200 dark:border-[#2e2e2e] rounded-[3px] px-2 py-1 text-[10px] w-[100px] outline-none focus:border-black dark:focus:border-[#f0f0ee] transition-colors font-sans bg-transparent dark:text-[#f0f0ee]"
                  placeholder="Nouveau tag..."
                  maxlength="20"
                  @keydown.enter="confirmNewTag"
                  @keydown.escape="addingTag = false; newTagValue = ''"
                />
              </template>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-[#252525]">
            <button
              class="px-4 py-[7px] text-xs border border-gray-200 dark:border-[#2e2e2e] rounded-[3px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-all font-sans bg-transparent cursor-pointer"
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
```

- [ ] **Step 2: Update `app/components/ui/TagChip.vue`**

Replace the entire file with:

```vue
<template>
  <button
    :class="[
      'px-[10px] py-1 rounded-[3px] text-[10px] font-semibold tracking-[0.5px] border transition-all duration-150 font-sans cursor-pointer',
      selected
        ? 'bg-black text-white border-black dark:bg-[#f0f0ee] dark:text-[#0d0d0d] dark:border-[#f0f0ee]'
        : 'bg-transparent text-gray-600 border-gray-200 hover:border-black hover:text-black dark:text-gray-400 dark:border-[#2e2e2e] dark:hover:border-[#f0f0ee] dark:hover:text-[#f0f0ee]',
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

- [ ] **Step 3: Update `app/components/ui/ColorSwatch.vue`**

Replace the entire file with:

```vue
<template>
  <button
    :style="{ background: color }"
    :class="[
      'w-[22px] h-[22px] rounded-full border-2 flex-shrink-0 transition-all duration-100 cursor-pointer',
      selected ? 'border-black dark:border-white scale-[1.08]' : 'border-transparent hover:scale-110',
    ]"
    @click="$emit('select', color)"
  />
</template>

<script setup lang="ts">
defineProps<{ color: string; selected: boolean }>()
defineEmits<{ select: [color: string] }>()
</script>
```

- [ ] **Step 4: Commit**

```bash
git add app/components/ui/EventModal.vue app/components/ui/TagChip.vue app/components/ui/ColorSwatch.vue
git commit -m "style(dark-theme): dark mode for modal, tag chip, and color swatch"
```

---

## Task 9: Matrix page + components

**Files:**
- Modify: `app/pages/matrix.vue`
- Modify: `app/components/matrix/MatrixQuadrant.vue`
- Modify: `app/components/matrix/MatrixTaskItem.vue`
- Modify: `app/components/matrix/MatrixNotesArea.vue`

- [ ] **Step 1: Update `app/pages/matrix.vue`**

Replace the `<template>` block with:

```vue
<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <header class="flex items-center justify-between px-4 sm:px-7 py-[14px] sm:pl-6 border-b border-gray-200 dark:border-[#2e2e2e] flex-shrink-0">
      <span class="font-display text-[20px] font-normal tracking-[-0.3px]">Priority Matrix</span>
      <span class="text-xs text-gray-400">{{ dateLabel }}</span>
    </header>

    <!-- Desktop layout -->
    <template v-if="!isMobile">
      <div class="flex-1 flex overflow-hidden min-h-0">
        <div class="w-5 flex items-center justify-center flex-shrink-0">
          <span class="-rotate-90 text-[8px] tracking-[2px] uppercase text-gray-400 dark:text-[#555555] font-semibold whitespace-nowrap pointer-events-none select-none">IMPORTANCE</span>
        </div>

        <div
          class="flex-1 grid overflow-hidden px-6 min-h-0"
          style="grid-template-columns: 1fr 1fr 190px; grid-template-rows: 1fr 1fr;"
        >
          <MatrixQuadrant
            title="Important, Not Urgent"
            subtitle="Décider quand faire"
            quadrant-id="inu"
            container-class="border border-gray-200 dark:border-[#2e2e2e] p-3 border-r-0 border-b-0"
          />
          <MatrixQuadrant
            title="Important &amp; Urgent"
            subtitle="Faire immédiatement"
            quadrant-id="iu"
            container-class="border border-gray-200 dark:border-[#2e2e2e] p-3 border-b-0"
          />
          <MatrixQuadrant
            title="Tasks for Today"
            quadrant-id="today"
            container-class="border border-gray-200 dark:border-[#2e2e2e] p-3 border-l-0 row-span-2"
          />
          <MatrixQuadrant
            title="Not Important &amp; Not Urgent"
            subtitle="Faire plus tard"
            quadrant-id="ninu"
            container-class="border border-gray-200 dark:border-[#2e2e2e] p-3 border-r-0"
          />
          <MatrixQuadrant
            title="Not Important &amp; Urgent"
            subtitle="Déléguer"
            quadrant-id="niu"
            container-class="border border-gray-200 dark:border-[#2e2e2e] p-3"
          />
        </div>
      </div>

      <div class="flex items-center justify-center gap-2 text-[8px] tracking-[2px] uppercase text-gray-300 dark:text-[#555555] font-semibold py-1 border-t border-gray-200 dark:border-[#2e2e2e] flex-shrink-0">
        <span class="text-sm leading-none">−</span>
        URGENCY
        <span class="text-sm leading-none">+</span>
      </div>

      <div
        class="grid border-t border-gray-200 dark:border-[#2e2e2e] flex-shrink-0 h-[120px] px-6"
        style="grid-template-columns: 1fr 190px;"
      >
        <div class="border-r border-gray-200 dark:border-[#2e2e2e] py-[10px] px-[14px] flex flex-col overflow-hidden">
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
          container-class="p-4 border-b border-gray-200 dark:border-[#2e2e2e] min-h-[120px]"
        />
        <MatrixQuadrant
          title="Important, Not Urgent"
          subtitle="Décider quand faire"
          quadrant-id="inu"
          container-class="p-4 border-b border-gray-200 dark:border-[#2e2e2e] min-h-[120px]"
        />
        <MatrixQuadrant
          title="Not Important &amp; Urgent"
          subtitle="Déléguer"
          quadrant-id="niu"
          container-class="p-4 border-b border-gray-200 dark:border-[#2e2e2e] min-h-[120px]"
        />
        <MatrixQuadrant
          title="Not Important &amp; Not Urgent"
          subtitle="Faire plus tard"
          quadrant-id="ninu"
          container-class="p-4 border-b border-gray-200 dark:border-[#2e2e2e] min-h-[120px]"
        />
        <MatrixQuadrant
          title="Tasks for Today"
          quadrant-id="today"
          container-class="p-4 border-b border-gray-200 dark:border-[#2e2e2e] min-h-[120px]"
        />
        <MatrixQuadrant
          title="Tasks for Tomorrow"
          quadrant-id="tomorrow"
          container-class="p-4 border-b border-gray-200 dark:border-[#2e2e2e] min-h-[120px]"
        />
        <div class="p-4 min-h-[100px] flex flex-col">
          <MatrixNotesArea />
        </div>
      </div>
    </template>
  </div>
</template>
```

- [ ] **Step 2: Update `app/components/matrix/MatrixQuadrant.vue`**

Replace the `<template>` block with:

```vue
<template>
  <div class="flex flex-col overflow-hidden" :class="containerClass">
    <div class="mb-2 pb-[7px] border-b border-gray-200 dark:border-[#2e2e2e] flex-shrink-0">
      <div class="text-[9px] font-semibold tracking-[1px] uppercase text-black dark:text-[#f0f0ee]">{{ title }}</div>
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
      class="text-[10px] text-gray-300 dark:text-[#444444] cursor-pointer pt-[3px] transition-colors hover:text-gray-600 dark:hover:text-[#888888] bg-transparent border-none font-sans flex-shrink-0 text-left"
      @click="addTask"
    >
      + ajouter
    </button>
  </div>
</template>
```

- [ ] **Step 3: Update `app/components/matrix/MatrixTaskItem.vue`**

Replace the `<template>` block with:

```vue
<template>
  <div class="flex items-center gap-[7px] py-[3px]">
    <input
      type="checkbox"
      :checked="task.done"
      class="matrix-checkbox"
      @change="toggle"
    />
    <span
      v-if="!editing"
      :class="[
        'text-[11px] flex-1 cursor-text leading-tight min-h-[16px]',
        task.done ? 'line-through text-gray-400' : 'text-black dark:text-[#f0f0ee]',
      ]"
      @click="startEdit"
    >{{ task.text || ' ' }}</span>
    <input
      v-else
      ref="inputRef"
      v-model="localText"
      type="text"
      class="text-[11px] flex-1 bg-transparent border-none outline-none border-b border-gray-200 dark:border-[#2e2e2e] text-black dark:text-[#f0f0ee] font-sans leading-tight"
      placeholder="Tâche..."
      @blur="commit"
      @keydown.enter.prevent="commitAndAddNext"
      @keydown.backspace="handleBackspace"
    />
  </div>
</template>
```

- [ ] **Step 4: Update `app/components/matrix/MatrixNotesArea.vue`**

Replace the entire file with:

```vue
<template>
  <div class="flex flex-col overflow-hidden h-full">
    <div class="section-label mb-[6px] flex-shrink-0">Notes + Ideas</div>
    <textarea
      :value="store.notes"
      class="w-full flex-1 resize-none border-none outline-none font-sans text-[11px] text-black dark:text-[#f0f0ee] leading-[1.8] bg-transparent placeholder:text-gray-400 dark:placeholder:text-[#555555]"
      placeholder="Idées, réflexions, références..."
      @input="store.setNotes(($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
const store = useMatrixStore()
</script>
```

- [ ] **Step 5: Commit**

```bash
git add app/pages/matrix.vue app/components/matrix/MatrixQuadrant.vue app/components/matrix/MatrixTaskItem.vue app/components/matrix/MatrixNotesArea.vue
git commit -m "style(dark-theme): dark mode for matrix page and components"
```

---

## Task 10: Login page

**Files:**
- Modify: `app/pages/login.vue`

- [ ] **Step 1: Update the `<template>` block of `app/pages/login.vue`**

Replace the template block with:

```vue
<template>
  <div class="w-full max-w-sm px-6">
    <div class="mb-10 text-center">
      <h1 class="font-display text-4xl italic text-black dark:text-[#f0f0ee] mb-1">Meridian</h1>
      <p class="text-[11px] tracking-[3px] uppercase text-gray-400 font-sans">Day Planner</p>
    </div>

    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <input
          ref="inputRef"
          v-model="password"
          type="password"
          placeholder="Password"
          autocomplete="current-password"
          class="w-full px-4 py-3 bg-white dark:bg-[#1a1a1a] border rounded text-sm font-sans text-black dark:text-[#f0f0ee] placeholder-gray-400 dark:placeholder-[#555555] outline-none transition-colors"
          :class="error ? 'border-red-400 focus:border-red-400' : 'border-gray-200 dark:border-[#2e2e2e] focus:border-black dark:focus:border-[#f0f0ee]'"
          @input="error = false"
        />
        <p v-if="error" class="mt-2 text-[11px] text-red-400 tracking-wide">Mot de passe incorrect</p>
      </div>

      <button type="submit" class="btn-primary w-full py-3 text-center">
        Accéder
      </button>
    </form>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/pages/login.vue
git commit -m "style(dark-theme): dark mode for login page"
```

---

## Task 11: Settings page — theme toggle + dark classes

**Files:**
- Modify: `app/pages/settings.vue`

- [ ] **Step 1: Replace the `<template>` block of `app/pages/settings.vue`**

```vue
<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <header class="border-b border-gray-200 dark:border-[#2e2e2e] flex-shrink-0 px-4 sm:px-7 sm:pl-6 pt-[14px] pb-[14px]">
      <span class="font-display text-[20px] font-normal tracking-[-0.3px]">Settings</span>
    </header>

    <div class="flex-1 overflow-y-auto px-4 sm:px-7 sm:pl-6 py-6 max-w-[560px]">

      <!-- Apparence -->
      <div class="mb-8">
        <p class="section-label mb-3">Apparence</p>
        <div class="flex gap-1">
          <button
            v-for="opt in themeOptions"
            :key="opt.value"
            :class="[
              'px-[10px] py-[5px] text-[11px] font-medium tracking-[0.5px] border rounded-[4px] transition-all font-sans cursor-pointer',
              themeStore.theme === opt.value
                ? 'bg-black text-white border-black dark:bg-[#f0f0ee] dark:text-[#0d0d0d] dark:border-[#f0f0ee]'
                : 'bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-black dark:text-gray-400 dark:border-[#2e2e2e] dark:hover:bg-[#252525] dark:hover:text-[#f0f0ee]',
            ]"
            @click="themeStore.setTheme(opt.value)"
          >{{ opt.label }}</button>
        </div>
      </div>

      <!-- Google Calendar section -->
      <div class="mb-8">
        <p class="section-label mb-3">Google Calendar</p>

        <!-- Not connected -->
        <div v-if="!googleStore.isConnected">
          <div class="border border-gray-200 dark:border-[#2e2e2e] rounded-md p-4 flex items-center justify-between gap-4">
            <div>
              <p class="text-[13px] font-semibold text-black dark:text-[#f0f0ee] mb-[2px]">Connecter un compte Google</p>
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
          <div class="border border-gray-200 dark:border-[#2e2e2e] rounded-md p-3 flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-[12px] font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                {{ googleStore.account!.googleEmail[0]?.toUpperCase() }}
              </div>
              <div>
                <p class="text-[12px] font-semibold text-black dark:text-[#f0f0ee]">{{ googleStore.account!.googleEmail }}</p>
                <p class="text-[10px] text-gray-400">
                  {{ googleStore.lastSyncedAt ? `Dernière sync : ${timeSince(googleStore.lastSyncedAt)}` : 'Non synchronisé' }}
                </p>
              </div>
            </div>
            <button
              class="px-3 py-[5px] text-[10px] font-semibold border border-red-300 text-red-500 rounded-[3px] hover:bg-red-50 dark:hover:bg-red-900/20 transition-all bg-transparent cursor-pointer"
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
            <div v-else-if="calsError" class="text-[11px] text-red-500 py-2 flex items-start gap-2">
              <span class="flex-1">Impossible de charger les calendriers : {{ calsError }}</span>
              <button class="underline cursor-pointer bg-transparent border-none text-red-400 flex-shrink-0" @click="fetchAvailableCals">Réessayer</button>
            </div>
            <div v-else class="flex flex-col gap-2">
              <label
                v-for="cal in availableCals"
                :key="cal.id"
                class="flex items-center gap-3 border border-gray-200 dark:border-[#2e2e2e] rounded-[5px] p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
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
                <span class="text-[12px] font-medium text-black dark:text-[#f0f0ee] flex-1">{{ cal.name }}</span>
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
                class="flex items-center justify-between border border-gray-200 dark:border-[#2e2e2e] rounded-[5px] p-3"
              >
                <div class="flex items-center gap-3">
                  <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ background: cal.color }" />
                  <span class="text-[12px] font-medium text-black dark:text-[#f0f0ee]">{{ cal.name }}</span>
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
```

- [ ] **Step 2: Update the `<script setup>` block of `app/pages/settings.vue`** to import the theme store and define options

Replace `<script setup lang="ts">` block with:

```vue
<script setup lang="ts">
import { useGoogleStore } from '~/stores/google'
import { useEventsStore, EVENT_COLORS } from '~/stores/events'
import { useThemeStore } from '~/stores/theme'

const googleStore = useGoogleStore()
const eventsStore = useEventsStore()
const themeStore = useThemeStore()
const route = useRoute()
const router = useRouter()

const themeOptions = [
  { value: 'light' as const, label: 'Clair' },
  { value: 'system' as const, label: 'Système' },
  { value: 'dark' as const, label: 'Sombre' },
]

const disconnecting = ref(false)
const loadingCals = ref(false)
const savingCals = ref(false)
const availableCals = ref<Array<{ id: string; name: string; color: string; selected: number }>>([])
const calsError = ref<string | null>(null)

async function fetchAvailableCals() {
  loadingCals.value = true
  calsError.value = null
  try {
    availableCals.value = await $fetch('/api/google/calendars')
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    calsError.value = msg
  }
  finally {
    loadingCals.value = false
  }
}

onMounted(() => {
  if (route.query.step === 'calendars') {
    fetchAvailableCals()
  }
})

watch(
  () => googleStore.isConnected,
  (connected) => {
    if (connected && route.query.step === 'calendars' && availableCals.value.length === 0 && !loadingCals.value) {
      fetchAvailableCals()
    }
  },
)

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

- [ ] **Step 3: Start the dev server and verify**

```bash
npm run dev
```

Open `http://localhost:3000/settings`. You should see a three-button "Apparence" toggle (Clair / Système / Sombre) at the top of the settings page. Clicking each button should switch the theme immediately. Reloading the page should preserve the selected theme.

- [ ] **Step 4: Commit**

```bash
git add app/pages/settings.vue
git commit -m "feat(dark-theme): add theme toggle to settings and dark classes"
```

---

## Final verification checklist

- [ ] Toggle to **Sombre** in Settings → full app is dark (no white flash on load)
- [ ] Toggle to **Clair** → full app is light
- [ ] Toggle to **Système** → matches OS preference; changing OS preference while on Système updates the app live
- [ ] Reload the page → selected theme persists (localStorage key `meridian-theme`)
- [ ] Timeline day view: borders subtle, hour labels readable, drag preview visible
- [ ] Month calendar: grid gap uses dark color, today circle inverted, selected cell visible
- [ ] Matrix: quadrant borders visible, checkboxes legible when checked in dark
- [ ] EventModal: dark card with readable inputs and buttons
- [ ] Login page: dark input field
- [ ] Mobile nav bar: dark background
