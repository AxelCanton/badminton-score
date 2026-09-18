# Badminton Score

Application Next.js 16 (App Router) avec authentification email/mot de passe,
Prisma 7 + PostgreSQL. Déploiement sur Vercel (plan Hobby).

## Stack

| Rôle            | Choix                             |
| --------------- | --------------------------------- |
| Framework       | Next.js 16 (App Router, Turbopack)|
| Auth            | Better Auth (sessions en base)    |
| ORM             | Prisma 7 (driver adapter `pg`)    |
| Base de données | PostgreSQL 17                     |
| Styles          | Tailwind CSS v4                   |

## Prérequis

- **Node.js >= 20.19** (Next.js 16 et Prisma 7 ne supportent pas Node 16/18)
- Docker + Docker Compose (base de données de dev)

## Démarrage

```bash
cp .env.example .env          # puis renseigner BETTER_AUTH_SECRET
npm install
npm run db:up                 # PostgreSQL local sur le port 5432
npm run db:migrate            # applique les migrations
npm run db:seed               # crée le compte par défaut
npm run dev
```

L'application est disponible sur http://localhost:3000.

### Compte par défaut

Il n'y a **pas d'inscription publique** : l'endpoint d'inscription est désactivé
(`disableSignUp`). Le compte initial est créé par `prisma/seed.ts`, piloté par les
variables `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` et `SEED_USER_NAME` ; il reçoit
tous les droits.

Valeurs par défaut : `admin@badminton-score.local` / `changeme123`.

Les comptes suivants se créent depuis **/admin/users**, par un compte disposant du
droit `MANAGE_USERS`. L'administrateur saisit le mot de passe initial et le
transmet au joueur (aucun email n'est envoyé).

## Scripts

| Script               | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Serveur de développement                 |
| `npm run build`      | Build de production                      |
| `npm run typecheck`  | Vérification TypeScript                  |
| `npm run lint`       | ESLint                                   |
| `npm run db:up`      | Démarre PostgreSQL (Docker)              |
| `npm run db:down`    | Arrête PostgreSQL                        |
| `npm run db:migrate` | Crée et applique une migration (dev)     |
| `npm run db:deploy`  | Applique les migrations (prod/CI)        |
| `npm run db:seed`    | Crée le compte par défaut                |
| `npm run db:studio`  | Prisma Studio                            |

## Architecture

```
app/
  api/auth/[...all]/route.ts  Handler Better Auth (GET/POST)
  login/                      Page de connexion (formulaire client)
  (app)/                      Pages authentifiées (layout + navigation)
    dashboard/                Résumé et derniers matchs
    matches/                  Liste des matchs
    matches/new/              Saisie d'un résultat (droit RECORD_MATCH)
    stats/                    Statistiques globales et par joueur
    players/[id]/             Fiche d'un joueur
    admin/users/              Gestion des comptes (droit MANAGE_USERS)
  forbidden.tsx               Page 403 rendue par forbidden()
  page.tsx                    Redirige vers /login ou /dashboard
lib/
  auth.ts                     Config serveur Better Auth
  auth-client.ts              Client Better Auth (React)
  prisma.ts                   Client Prisma (singleton + driver adapter)
  dal.ts                      Data Access Layer : session et gardes de droits
  permissions.ts              Enum Permission + libellés d'affichage
  stats.ts                    Calcul des statistiques globales / par joueur
  actions/users.ts            Server Actions : création de comptes, droits
  actions/matches.ts          Server Action : enregistrement d'un match
prisma/
  schema.prisma               Auth (User/Session/Account) + domaine badminton
  seed.ts                     Compte initial, doté de tous les droits
prisma.config.ts              Config Prisma 7 (URL de connexion, seed)
proxy.ts                      Ex-middleware : filtrage optimiste des routes
```

### Droits

Les droits sont attribués **compte par compte** (table `user_permission`) :

| Droit          | Permet                                               |
| -------------- | ---------------------------------------------------- |
| `MANAGE_USERS` | Créer des comptes et attribuer les droits            |
| `RECORD_MATCH` | Enregistrer des résultats de matchs                  |

Tout compte connecté peut consulter les matchs et les statistiques. Le compte
créé par le seed reçoit l'ensemble des droits. Un administrateur ne peut pas se
retirer `MANAGE_USERS` s'il est le dernier à le détenir.

### Modèle de données

Un match a un format (`SINGLES` / `DOUBLES`), un score par équipe et une date.
Le vainqueur est l'équipe au score le plus élevé — l'égalité est refusée à la
saisie. Les joueurs sont choisis parmi les comptes inscrits, et `recordedById`
conserve qui a saisi le résultat.

### Notes d'implémentation

- **`proxy.ts`** remplace `middleware.ts` depuis Next.js 16. Il ne fait qu'un
  contrôle *optimiste* (présence du cookie), sans accès base — comme recommandé
  par la documentation. La vérification réelle vit dans `lib/dal.ts`, au plus
  près des données.
- **Prisma 7** n'accepte plus `url` dans `schema.prisma` : la connexion est
  déclarée dans `prisma.config.ts` et le client reçoit un driver adapter
  (`@prisma/adapter-pg`).
- Le mot de passe est stocké dans la table `account` (`providerId: "credential"`),
  et non sur `user`, conformément au modèle de Better Auth.
- Les gardes de droits (`requirePermission`) vivent dans `lib/dal.ts` et sont
  appelées dans **chaque page et chaque Server Action** sensible : une Server
  Action est joignable par POST direct, masquer un lien ne protège rien.
- `forbidden()` nécessite le flag `experimental.authInterrupts` (activé dans
  `next.config.ts`) et rend `app/forbidden.tsx`.

## Déploiement sur Vercel

1. Importer le dépôt dans Vercel.
2. Définir les variables d'environnement (Production) :
   - `DATABASE_URL` → URL de la base **badmin-score-db**
   - `BETTER_AUTH_SECRET` → `openssl rand -base64 32`
   - `BETTER_AUTH_URL` → URL de production (ex. `https://badminton-score.vercel.app`)
3. Le `postinstall` lance `prisma generate` automatiquement.
4. Appliquer les migrations sur la base de production :
   ```bash
   DATABASE_URL="<url-prod>" npm run db:deploy
   ```
5. Créer le compte initial en production :
   ```bash
   DATABASE_URL="<url-prod>" SEED_USER_EMAIL="..." SEED_USER_PASSWORD="..." npm run db:seed
   ```

> Sur le plan Hobby, préférer une URL de connexion *poolée* (pgbouncer) pour
> éviter d'épuiser les connexions depuis les fonctions serverless.
