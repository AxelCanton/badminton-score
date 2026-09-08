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
(`disableSignUp`). Les comptes sont créés en base via `prisma/seed.ts`, piloté par
les variables `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` et `SEED_USER_NAME`.

Valeurs par défaut : `admin@badminton-score.local` / `changeme123`.

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
  dashboard/                  Page protégée
  page.tsx                    Redirige vers /login ou /dashboard
lib/
  auth.ts                     Config serveur Better Auth
  auth-client.ts              Client Better Auth (React)
  prisma.ts                   Client Prisma (singleton + driver adapter)
  dal.ts                      Data Access Layer : getSession / requireSession
prisma/
  schema.prisma               Modèles User / Session / Account / Verification
  seed.ts                     Compte par défaut
prisma.config.ts              Config Prisma 7 (URL de connexion, seed)
proxy.ts                      Ex-middleware : filtrage optimiste des routes
```

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
