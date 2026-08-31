# Finza

Financial OS personnel et familial pour l'Afrique francophone. *Ton argent. Ta vision. Ton contrôle.*

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
4. Applique les migrations SQL du dossier `supabase/migrations` dans l'éditeur SQL du projet Supabase (ou via la CLI Supabase).

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
