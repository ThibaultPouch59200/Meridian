# Meridian

Day planner personnel — vue journalière (Timeline), matrice Eisenhower (Matrix), et synchronisation bidirectionnelle avec Google Calendar.

---

## Google Calendar — configuration de l'application OAuth

Pour activer la synchronisation Google Calendar, il faut créer une application OAuth dans la Google Cloud Console et renseigner les identifiants dans le fichier `.env`.

### 1. Créer un projet Google Cloud

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créer un nouveau projet (ou en sélectionner un existant)

### 2. Activer l'API Google Calendar

1. Dans le menu latéral → **APIs & Services** → **Library**
2. Rechercher **Google Calendar API** et cliquer **Enable**

### 3. Créer les identifiants OAuth 2.0

1. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
2. Si demandé, configurer l'**OAuth consent screen** :
   - User Type : **External** (ou Internal si compte Workspace)
   - Remplir le nom de l'application, l'email de contact
   - Ajouter les scopes : `../auth/calendar`, `../auth/calendar.events`, `../auth/calendar.readonly`, `email`, `profile`
   - Ajouter ton adresse email comme **Test user** (tant que l'app est en mode Test)
3. Retourner dans **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type : **Web application**
   - Authorized redirect URIs : ajouter `http://localhost:3000/api/auth/google/callback`
4. Copier le **Client ID** et le **Client Secret**

### 4. Configurer le fichier `.env`

Copier `.env.example` en `.env` à la racine du projet et renseigner les valeurs :

```env
NUXT_GOOGLE_CLIENT_ID=ton-client-id.apps.googleusercontent.com
NUXT_GOOGLE_CLIENT_SECRET=GOCSPX-ton-secret
NUXT_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

> En production, remplacer `http://localhost:3000` par l'URL publique de l'instance, et l'ajouter dans les **Authorized redirect URIs** de la console Google.

### 5. Connecter le compte dans l'app

1. Lancer l'app (`npm run dev`)
2. Cliquer sur l'icône ⚙ dans la sidebar → **Settings**
3. Cliquer **Connecter** → flow OAuth Google
4. Sélectionner les calendriers à importer → **Confirmer**

Les événements Google apparaissent dans la Timeline avec un badge **G**. Les événements créés dans Meridian sont pushés vers un calendrier dédié **"Meridian"** dans Google Calendar.

---

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
