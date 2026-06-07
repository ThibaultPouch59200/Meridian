# Meridian — Matrix Page Design Spec

**Date:** 2026-06-07
**Scope:** Full Matrix page implementation (jalon 2, part 1)
**Status:** Approved

---

## Context

The Matrix page skeleton was delivered in jalon 1: layout, quadrant shell components, and an empty Pinia store. This spec covers the full implementation: store logic, task interactivity (click-to-edit), drag-and-drop between lists, notes persistence, and localStorage sync.

---

## Data Model

The existing `Task` type in `types/index.ts` is sufficient and unchanged:

```ts
export interface Task {
  id: string
  text: string
  done: boolean
}

export type QuadrantId = 'inu' | 'iu' | 'ninu' | 'niu' | 'today' | 'tomorrow'
```

---

## Store: `app/stores/matrix.ts`

### State

```ts
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
})
```

### Actions

| Action | Signature | Description |
|---|---|---|
| `addTask` | `(quadrant: QuadrantId, text?: string) => string` | Appends a new task, returns its id |
| `updateTask` | `(quadrant: QuadrantId, id: string, patch: Partial<Task>) => void` | Merges patch into the task |
| `deleteTask` | `(quadrant: QuadrantId, id: string) => void` | Removes the task by id |
| `moveTask` | `(from: QuadrantId, to: QuadrantId, task: Task, toIndex: number) => void` | Removes from source, inserts at target index |
| `setNotes` | `(value: string) => void` | Updates notes string |
| `load` | `() => void` | Hydrates state from localStorage |
| `save` | `() => void` | Persists state to localStorage |

### Persistence

- `load()` is called from `app/plugins/stores.client.ts` alongside the existing events store init.
- A deep `watch` on `{ tasks, notes }` calls `save()` on every change (no debounce needed — writes are small).
- localStorage key: `'meridian-matrix'`.

---

## Component Changes

### `MatrixQuadrant.vue`

**Props added:**
```ts
defineProps<{
  title: string
  subtitle?: string
  borderClass?: string
  quadrantId: QuadrantId   // new
}>()
```

**Template changes:**
- Replace the `<slot>` with a `<VueDraggable>` bound to `matrixStore.tasks[quadrantId]`.
- `group="tasks"` on all instances enables cross-list drag.
- Renders `<MatrixTaskItem>` for each task, passing `task`, `quadrantId`, and the item index.
- "+ ajouter" button calls `matrixStore.addTask(quadrantId)` then focuses the newly created row.

**Cross-list DnD:** When `vue-draggable-plus` fires `onAdd`, call `matrixStore.moveTask(from, to, task, newIndex)`. The store is the single source of truth — the `v-model` on `<VueDraggable>` is the store's task array directly.

### `MatrixTaskItem.vue`

**Props:**
```ts
defineProps<{
  task: Task
  quadrantId: QuadrantId
}>()
```

**Emits:** none — the component writes directly to the store via `useMatrixStore()`.

**Local state:**
```ts
const editing = ref(task.text === '')  // new tasks open in edit mode
```

**Template behavior:**
- When `!editing`: render a `<span>` with the task text (strikethrough + gray if `task.done`). Click → `editing = true`, `nextTick` focuses the input.
- When `editing`: render a text `<input>` with `autofocus`. On `blur` or `Enter` → commit text (`updateTask`) or delete if empty (`deleteTask`). On `Backspace` when value is empty → `deleteTask` + focus previous row.
- Checkbox: `@change` → `updateTask(quadrantId, task.id, { done: !task.done })`.

### `MatrixNotesArea.vue`

- Add `useMatrixStore()` and bind the textarea with `:value="matrixStore.notes"` + `@input="matrixStore.setNotes($event.target.value)"`.

### `matrix.vue` (page)

- Pass `quadrantId` prop to each `<MatrixQuadrant>`.
- Wire "Tasks for Today" and "Tasks for Tomorrow" columns using the same `<MatrixQuadrant>` component with `quadrantId="today"` / `quadrantId="tomorrow"`.
- Remove all "À implémenter" placeholder divs.
- No logic in the page — delegate entirely to components and store.

---

## Dependency

Add `vue-draggable-plus` to the project:

```bash
npm install vue-draggable-plus
```

Import in components as:
```ts
import { VueDraggable } from 'vue-draggable-plus'
```

No Nuxt plugin registration needed — it's a component import.

---

## Interaction Summary

| Trigger | Behavior |
|---|---|
| Click task text | Opens inline edit input |
| Enter in input | Saves task, adds new empty task below, focuses it |
| Backspace on empty input | Deletes task, focuses previous row |
| Blur input | Saves task (or deletes if empty) |
| Check checkbox | Toggles `done`, text gets strikethrough |
| Drag task row | Reorders within list or moves to another list |
| Click "+ ajouter" | Adds empty task at end of list, opens in edit mode |
| Type in notes | Auto-saves to store on every input event |

---

## Out of Scope

- Drag-and-drop visual animations beyond Sortable.js defaults (no custom ghost styling).
- Task due dates, priorities, or tags on matrix tasks.
- Supabase persistence (localStorage only for this jalon).
- Drag-select on the timeline (separate task in jalon 2).
