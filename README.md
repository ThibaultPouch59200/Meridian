# Meridian

Day planner personnel avec timeline journalière et matrice de priorités Eisenhower.

## Stack

- **Nuxt 3** - Framework fullstack
- **Tailwind CSS** - Styling
- **Pinia** - State management
- **TypeScript** - Typage strict

## Lancer le projet

```bash
npm install
npm run dev
```

## Déployer

```bash
docker-compose up -d
```

## Structure

```
components/   Composants UI découpés par domaine
composables/  Logique réutilisable
stores/       State Pinia (events, matrix, tags)
pages/        timeline.vue / matrix.vue
types/        Interfaces TypeScript
docs/         Maquette HTML de référence
```

## Conventions

Commits au format [Conventional Commits](https://www.conventionalcommits.org/), principes SOLID et KISS. Voir `CLAUDE.md` pour le détail.
