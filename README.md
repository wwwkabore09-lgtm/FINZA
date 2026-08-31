# Finza

Financial OS personnel et familial pour l'Afrique francophone. *Ton argent. Ta vision. Ton contrôle.*

- **App en ligne** : https://finza-web-2026.vercel.app
- **Dépôt** : https://github.com/wwwkabore09-lgtm/FINZA
- **Déploiement continu** : chaque `git push` sur `main` redéploie automatiquement via Vercel.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (Auth + Postgres + Row Level Security)
- React Router
- Déploiement : Vercel

## Lancer le projet en local

```bash
npm install
npm run dev
```

L'app est disponible sur http://localhost:5173.

## Configuration Supabase

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Copie `.env.example` vers `.env.local` :

   ```bash
   cp .env.example .env.local
   ```

3. Renseigne `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (Project Settings → API) dans `.env.local`.
4. Applique `supabase/migrations/20260831000000_init_schema.sql` dans l'éditeur SQL du projet Supabase (ou via `supabase db push` si tu utilises la CLI Supabase). Il crée les tables `households`, `household_members`, `accounts`, `categories`, `transactions`, `budgets`, `goals` avec Row Level Security activée : chaque utilisateur ne voit que les données des foyers dont il est membre.

## Structure du projet

```
src/
  pages/       Écrans (Landing, Login, Dashboard)
  components/  Composants partagés (AuthProvider, ProtectedRoute, ...)
  lib/         Clients externes (Supabase)
  hooks/       Hooks React (useAuth)
  types/       Types TypeScript partagés
supabase/
  migrations/  Schéma SQL et policies RLS
```

## État actuel

Trois écrans fonctionnels : landing page, connexion/inscription (Supabase Auth par email/mot de passe), et un dashboard protégé avec des données factices. La logique métier (calculs de budget, agrégation de transactions réelles, etc.) n'est pas encore implémentée.
