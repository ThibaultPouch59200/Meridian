# Dark Theme — Design Spec

**Date:** 2026-06-26
**Branch:** feat/dark-theme

---

## Goal

Add a dark theme to Meridian. The user can choose between Light, System (OS preference), and Dark. The preference is persisted in localStorage. When set to System, the app responds live to OS changes.

---

## Architecture

### New file: `stores/theme.ts`

Pinia store managing theme state.

```ts
type Theme = 'light' | 'dark' | 'system'
```

- State: `theme: Theme` (default `'system'`)
- Persisted to `localStorage` under key `'meridian-theme'`
- Computed: `resolvedTheme: 'light' | 'dark'` — resolves `'system'` via `window.matchMedia('(prefers-color-scheme: dark)')`
- Action: `setTheme(t: Theme)` — updates state, persists to localStorage, calls `applyTheme()`
- Action: `applyTheme()` — adds/removes `dark` class on `<html>` based on `resolvedTheme`
- Action: `init()` — called on app mount; reads localStorage, applies class, subscribes to `matchMedia` change event for live OS updates

### `tailwind.config.ts`

Add `darkMode: 'class'` at the root of the config object.

### `app/app.vue`

Call `themeStore.init()` in `onMounted`.

---

## Dark color palette

All dark values are applied via `dark:` Tailwind classes directly in component templates.

| Role | Light class | Dark class |
|---|---|---|
| App background | `bg-gray-50` | `dark:bg-[#111111]` |
| Surface / card | `bg-white` | `dark:bg-[#1a1a1a]` |
| Elevated surface (modal, sidebar) | `bg-white` | `dark:bg-[#222222]` |
| Border | `border-gray-200` | `dark:border-[#2e2e2e]` |
| Border subtle | `border-gray-100` | `dark:border-[#252525]` |
| Primary text | `text-black` | `dark:text-[#f0f0ee]` |
| Secondary text | `text-gray-600` | `dark:text-gray-400` |
| Muted text | `text-gray-400` | `dark:text-[#666666]` |
| Hover background | `hover:bg-gray-50` | `dark:hover:bg-[#252525]` |
| Input background | `bg-white` | `dark:bg-[#1a1a1a]` |
| Input border focus | `focus:border-black` | `dark:focus:border-[#f0f0ee]` |

---

## CSS utility classes (`main.css`)

The following shared classes get dark overrides added in `@layer components`:

- **`.btn-primary`** — `dark:bg-[#f0f0ee] dark:text-[#0d0d0d]` (inverted: light button on dark bg)
- **`.form-input`** — `dark:bg-[#1a1a1a] dark:border-[#2e2e2e] dark:text-[#f0f0ee] dark:focus:border-[#f0f0ee]`
- **`.section-label`** — no change needed (uses `text-gray-400` which stays readable in dark)
- **`.matrix-checkbox`** — `dark:border-[#444]`; checked state in dark: `background: #f0f0ee; border-color: #f0f0ee` with a dark checkmark — `#0d0d0d` background is invisible against the `#111111` page bg
- **`.scrollbar-thin`** — scrollbar thumb color updated to `#333` in dark

---

## Settings toggle

Added to `app/pages/settings.vue`, at the top of the settings content area, above the Google Calendar section.

A new labelled section:

```
APPARENCE
[ Clair ]  [ Système ]  [ Sombre ]
```

Three-way button group. Active button: black background + white text. Inactive: border + gray text. Consistent with existing button style patterns in the app.

---

## Files to modify

| File | Change |
|---|---|
| `tailwind.config.ts` | Add `darkMode: 'class'` |
| `stores/theme.ts` | **New** — theme store |
| `app/app.vue` | Call `themeStore.init()` on mount |
| `app/assets/css/main.css` | Dark overrides for utility classes |
| `app/layouts/default.vue` | `dark:` classes on layout backgrounds/borders |
| `app/layouts/auth.vue` | `dark:bg-[#111111]` on full-screen wrapper |
| `app/pages/settings.vue` | Add theme toggle UI + dark classes |
| `app/pages/timeline.vue` | `dark:` classes throughout |
| `app/pages/matrix.vue` | `dark:` classes throughout |
| `app/pages/login.vue` | `dark:` classes |
| `app/components/layout/AppSidebar.vue` | `dark:` classes |
| `app/components/timeline/TimelineGrid.vue` | `dark:` classes |
| `app/components/timeline/TimelineHourRow.vue` | `dark:` classes |
| `app/components/timeline/EventBar.vue` | `dark:` classes |
| `app/components/timeline/MonthCalendar.vue` | `dark:` classes |
| `app/components/timeline/TimelineToggle.vue` | `dark:` classes |
| `app/components/matrix/MatrixQuadrant.vue` | `dark:` classes |
| `app/components/matrix/MatrixTaskItem.vue` | `dark:` classes |
| `app/components/matrix/MatrixNotesArea.vue` | `dark:` classes |
| `app/components/ui/EventModal.vue` | `dark:` classes |
| `app/components/ui/TagChip.vue` | `dark:` classes |
| `app/components/ui/ColorSwatch.vue` | `dark:` classes |
| `app/components/ui/IconButton.vue` | `dark:` classes |

---

## Out of scope

- Per-page or per-component theme overrides
- Animated theme transition (beyond the existing CSS transitions on color properties)
- Dark mode for the `docs/maquette.html` reference file
