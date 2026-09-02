# Notre Maison — Espace familial

Plateforme familiale privée : arbre généalogique interactif, album
photo, histoire familiale, anniversaires/calendrier, ainsi que la
gestion des cotisations et dépenses familiales.

## Stack
React + Vite, Supabase (Auth, PostgreSQL, Storage, Realtime), RLS
stricte par famille.

## Développement local
```bash
npm install
npm run dev
```

Créez un fichier `.env` local (jamais commité, voir `.gitignore`) avec :
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
Seule la clé publique **anon** doit figurer côté frontend — jamais la
`service_role`.

## Build de production
```bash
npm run build
```

## Documentation
- `PROJECT_STATUS.md` — état réel du projet, priorité par priorité.
- `design/` — décisions de design, revue de code, checklist de tests.
