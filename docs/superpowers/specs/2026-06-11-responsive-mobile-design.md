# Responsive Mobile Design — Spec

**Date :** 2026-06-11  
**Branche cible :** `feat/responsive-mobile`  
**Breakpoint mobile :** `< 640px` (Tailwind `sm:`)

---

## Contexte

Meridian est actuellement une SPA desktop-only. Le layout suppose une largeur d'écran suffisante pour la sidebar latérale (52px) et des grilles complexes (Matrix). Cette spec couvre l'adaptation complète pour les téléphones mobiles.

---

## Architecture & Breakpoints

**Stratégie :** Mobile-first avec breakpoints Tailwind + composable `useBreakpoint` pour les cas JS.

- **Breakpoint unique :** `< 640px` = mobile, `≥ 640px` = desktop (comportement actuel inchangé).
- Les classes Tailwind (`sm:`) gèrent le CSS. Le composable `useBreakpoint` gère uniquement les comportements JS qui ne peuvent pas être résolus en CSS seul.

**Nouveau fichier : `app/composables/useBreakpoint.ts`**

```ts
export function useBreakpoint() {
  const isMobile = ref(false)

  onMounted(() => {
    const update = () => { isMobile.value = window.innerWidth < 640 }
    update()
    window.addEventListener('resize', update)
    onUnmounted(() => window.removeEventListener('resize', update))
  })

  return { isMobile: readonly(isMobile) }
}
```

---

## Navigation — AppSidebar

**Desktop (≥ 640px) :** comportement actuel inchangé — sidebar verticale 52px à gauche.

**Mobile (< 640px) :** barre fixe en bas de l'écran.
- Hauteur : `h-14` (56px)
- Les 2 icônes (Timeline, Matrix) sont centrées horizontalement côte à côte
- `fixed bottom-0 left-0 right-0` avec `z-50`
- Fond blanc, `border-t border-gray-200`

**`app/layouts/default.vue`** :
- Desktop : `flex-row` (sidebar gauche + contenu droite) — inchangé
- Mobile : `flex-col` + `pb-14` sur le contenu pour éviter que la bottom nav recouvre le bas de page

---

## Page Timeline

### Header

**Desktop :** une seule ligne — inchangé.

**Mobile :** deux lignes.
- **Ligne 1 :** titre "Timeline" (gauche) + bouton "Ajouter" (droite)
- **Ligne 2 :** toggle Jour/Mois (gauche) + navigation `← date →` (droite)
- Le bouton "Aujourd'hui" est masqué sur mobile (`hidden sm:inline-flex`)

### Grille journalière (TimelineGrid)

La grille 24h est déjà scrollable verticalement. Aucune modification nécessaire — elle s'adapte naturellement à la largeur disponible.

### Vue mensuelle (MonthCalendar)

Les cellules réduisent leur taille via classes responsive (`text-xs`, padding réduit). Aucun composant supplémentaire nécessaire.

### EventModal

- **Desktop :** modale centrée (comportement actuel)
- **Mobile :** bottom sheet — `fixed inset-x-0 bottom-0`, `rounded-t-2xl`, hauteur max `max-h-[90vh]` avec scroll interne

---

## Page Matrix

### Layout desktop

Inchangé : grille CSS `grid-template-columns: 1fr 1fr 190px` avec axes IMPORTANCE/URGENCY.

### Layout mobile

Empilement vertical pleine largeur. Les axes IMPORTANCE et URGENCY sont masqués (`hidden sm:flex`).

**Ordre d'affichage (haut → bas) :**
1. Important & Urgent *(Faire immédiatement)*
2. Important, Pas Urgent *(Décider quand faire)*
3. Pas Important & Urgent *(Déléguer)*
4. Pas Important & Pas Urgent *(Faire plus tard)*
5. Tasks for Today
6. Tasks for Tomorrow
7. Notes (MatrixNotesArea)

Chaque quadrant : largeur 100%, `min-h-[120px]`, séparés par `border-b border-gray-200`.

La page est scrollable verticalement (`overflow-y-auto`).

---

## Fichiers impactés

| Fichier | Changement |
|---|---|
| `app/composables/useBreakpoint.ts` | Nouveau — composable isMobile |
| `app/layouts/default.vue` | Flex direction + pb-14 mobile |
| `app/components/layout/AppSidebar.vue` | Bottom nav sur mobile |
| `app/pages/timeline.vue` | Header 2 lignes + EventModal bottom sheet |
| `app/pages/matrix.vue` | Empilement vertical sur mobile |
| `app/components/ui/EventModal.vue` | Bottom sheet sur mobile |

---

## Ce qui ne change pas

- Toute la logique métier (stores Pinia, composables)
- Les composants `TimelineGrid`, `TimelineHourRow`, `EventBar`, `MatrixTaskItem`, `MatrixNotesArea`, `MatrixQuadrant` — pas de modifications nécessaires
- Le comportement desktop (≥ 640px) est strictement identique

---

## Hors scope

- Gestion du swipe/gesture natif
- PWA / icône sur l'écran d'accueil
- Optimisation des performances réseau mobile
