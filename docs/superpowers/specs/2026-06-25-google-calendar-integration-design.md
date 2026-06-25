# Google Calendar Integration — Design Spec

**Date:** 2026-06-25
**Status:** Approved

---

## Résumé

Intégration bidirectionnelle avec Google Calendar : import des calendriers Google dans Meridian, synchronisation au chargement, write-back des modifications vers Google, et page Settings dédiée pour gérer la connexion et les calendriers.

---

## Décisions structurantes

| Question | Décision |
|---|---|
| Comptes Google | Un seul par instance pour l'instant, structure multi-compte préparée en base |
| Sync | Au chargement de l'app (`onMounted` du layout) |
| Sélection des calendriers | Manuelle au moment du link (étape post-OAuth) |
| Rendu visuel | Identique aux events Meridian, couleur issue du calendrier Google |
| Couleur | Verrouillée dans EventModal, modifiable uniquement depuis `/settings` |
| Édition | Bidirectionnelle — modifs Meridian pushées vers Google Calendar API |
| Settings | Page `/settings` dédiée, icône ⚙ dans la sidebar |

---

## Architecture

```
Browser (Nuxt SPA)
  ├── /settings               ← nouvelle page
  ├── useGoogleStore          ← nouveau store Pinia
  └── EventModal              ← couleur verrouillée si source=google

Nuxt Server (Nitro)
  ├── /api/auth/google/redirect    ← démarre le flow OAuth
  ├── /api/auth/google/callback    ← reçoit le code, stocke les tokens
  ├── /api/auth/google/disconnect  ← révoque et supprime
  ├── /api/google/calendars        ← liste + toggle des calendriers
  └── /api/google/sync             ← upsert des events Google en base

SQLite (Drizzle)
  ├── google_accounts    ← tokens OAuth
  ├── google_calendars   ← calendriers sélectionnés + couleur override
  └── events             ← +source, +googleEventId, +googleCalendarId
```

---

## Schéma de données

### Nouvelles tables

```ts
// google_accounts
{
  id: text (PK)              // uuid local
  googleEmail: text
  accessToken: text
  refreshToken: text
  tokenExpiry: integer       // timestamp unix
  meridianCalendarId: text   // id du calendrier "Meridian" dans Google, null si pas encore créé
  createdAt: integer
}

// google_calendars
{
  id: text (PK)           // googleCalendarId (ex: "primary")
  googleAccountId: text (FK → google_accounts.id)
  name: text              // "Perso", "Pro"...
  color: text             // hex — overrideable depuis Settings
  selected: integer       // 0 | 1
}
```

### Table `events` — champs ajoutés

```ts
source: text           // 'meridian' | 'google', défaut 'meridian'
googleEventId: text    // id Google, null pour les events Meridian
googleCalendarId: text // FK → google_calendars.id, null pour Meridian
```

### Type `CalendarEvent` mis à jour

```ts
export interface CalendarEvent {
  id: string
  name: string
  desc?: string
  allDay?: boolean
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  location?: string
  color: string
  tag: string
  source: 'meridian' | 'google'
  googleEventId?: string
  googleCalendarId?: string
}
```

La couleur d'un event Google est résolue depuis `google_calendars.color` via le store — pas stockée sur l'event lui-même — pour que changer la couleur du calendrier dans Settings se répercute partout instantanément.

---

## Flow OAuth

1. Clic "Connecter Google" dans `/settings` → `GET /api/auth/google/redirect`
2. Redirect vers Google OAuth avec scopes :
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar` (pour créer le calendrier "Meridian")
3. Google redirige vers `/api/auth/google/callback?code=...`
4. Serveur échange le code → access + refresh tokens → insère dans `google_accounts`
5. Serveur fetch `/calendar/v3/calendarList` et redirige vers `/settings?step=calendars`
6. L'utilisateur coche ses calendriers → `POST /api/google/calendars/select` → `google_calendars` avec `selected=1`
7. Redirect vers `/settings` — premier sync déclenché

**Refresh token :** avant chaque appel Google API, le serveur vérifie `tokenExpiry`. Si expiré, refresh via `https://oauth2.googleapis.com/token` et met à jour `google_accounts`.

**Déconnexion :** révocation du token via `https://oauth2.googleapis.com/revoke`, suppression en cascade de `google_accounts`, `google_calendars`, et tous les events avec `source='google'`.

---

## Sync au chargement

```
onMounted (default.vue)
  └── useGoogleStore.sync()   ← si un compte est lié
        └── POST /api/google/sync
              ├── Fetch events de chaque google_calendars.selected=1
              │   (fenêtre : aujourd'hui -30j / +90j)
              ├── Upsert dans events (insert si googleEventId inconnu, update si connu)
              └── Delete les events Google absents de la réponse Google
        └── useEventsStore.fetch()   ← recharge tous les events
```

---

## Création d'event Meridian → Google Calendar

Quand un compte Google est connecté, chaque event créé dans Meridian est également pushé vers un calendrier dédié **"Meridian"** dans Google Calendar.

**Initialisation du calendrier "Meridian" :**
- Au premier `addEvent` après connexion Google (ou à la connexion si souhaité), le serveur vérifie si un calendrier "Meridian" existe via `GET /calendar/v3/calendarList`
- S'il n'existe pas, il le crée via `POST /calendar/v3/calendars`
- L'id du calendrier "Meridian" est stocké dans `google_accounts.meridianCalendarId`

**Flow `addEvent` :**
1. Insertion en base locale (comportement actuel)
2. Si compte Google connecté → `POST /api/google/events` → push vers le calendrier "Meridian" Google
3. Le `googleEventId` retourné par Google est mis à jour sur l'event local (`PUT /api/events/:id`)
4. L'event garde `source='meridian'` — il a été créé dans Meridian

**Champ ajouté à `google_accounts` :**
```ts
meridianCalendarId: text  // id du calendrier "Meridian" dans Google, null si pas encore créé
```

---

## Write-back (édition d'un event Google)

- `updateEvent()` dans `useEventsStore` détecte `source === 'google'`
- Appel `PATCH /api/google/events/:googleEventId` en plus du `PUT /api/events/:id` local
- Si Google retourne une erreur → rollback local + notification d'erreur utilisateur
- Champs writeable : `name`, `startTime`, `endTime`, `startDate`, `endDate`, `location`, `desc`

**Write-back pour les events `source='meridian'` avec `googleEventId` :**
- Même comportement — `updateEvent` et `deleteEvent` pushent vers Google si `googleEventId` est présent

---

## Page `/settings`

**État non connecté :**
- Section "Google Calendar" avec bouton "Connecter" → lance le flow OAuth

**État connecté :**
- Compte affiché (email + avatar initiale, timestamp dernière sync)
- Bouton "Déconnecter" (rouge, destructif)
- Liste des calendriers sélectionnés :
  - Dot de couleur + nom du calendrier
  - Palette de couleurs Meridian pour override local
  - Toggle de visibilité (masquer temporairement sans désélectionner)

**Sidebar :**
- Icône ⚙ ajoutée en bas de `AppSidebar`, desktop et mobile

---

## EventModal — event Google

- Badge source : `● Perso · Google Calendar` en haut du modal
- Champs éditables : titre, heure début/fin, date, lieu, description
- Couleur : affichée mais non éditable — texte "Définie dans Settings → Calendriers"
- Tag : absent (non applicable aux events Google)
- Bouton de sauvegarde : "Sauvegarder sur Google" (au lieu de "Sauvegarder")

---

## Gestion d'erreurs

| Cas | Comportement |
|---|---|
| Google API indisponible au chargement | Sync silencieusement ignorée, events existants conservés |
| Token expiré non refreshable | Notification "Reconnexion Google requise" + lien vers /settings |
| Write-back échoue | Rollback local + toast d'erreur |
| Calendrier Google supprimé depuis Google | Events orphelins retirés au prochain sync |

---

## Variables d'environnement requises

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

---

## Fichiers créés / modifiés

### Nouveaux
- `app/pages/settings.vue`
- `app/stores/google.ts`
- `server/api/auth/google/redirect.get.ts`
- `server/api/auth/google/callback.get.ts`
- `server/api/auth/google/disconnect.post.ts`
- `server/api/google/calendars.get.ts`
- `server/api/google/calendars/select.post.ts`
- `server/api/google/sync.post.ts`
- `server/api/google/events/index.post.ts`
- `server/api/google/events/[googleEventId].patch.ts`
- `server/api/google/events/[googleEventId].delete.ts`
- `app/components/layout/IconSettings.vue`

### Modifiés
- `types/index.ts` — ajout `source`, `googleEventId`, `googleCalendarId` sur `CalendarEvent`
- `server/db/schema.ts` — nouvelles tables + champs `events`
- `app/stores/events.ts` — write-back conditionnel sur `updateEvent`
- `app/components/layout/AppSidebar.vue` — icône ⚙ + lien `/settings`
- `app/layouts/default.vue` — sync Google au `onMounted`
- `app/components/ui/EventModal.vue` — comportement couleur/tag conditionnel
- `nuxt.config.ts` — ajout `googleClientId`, `googleClientSecret`, `googleRedirectUri` dans `runtimeConfig`
- `.env.example` — nouvelles variables
