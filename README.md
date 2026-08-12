# Karma Quest

Application web de gestion de points de Karma — style gaming, avec API REST, base PostgreSQL et déploiement Docker.

## Fonctionnalités

- **Jauge de karma** animée, avec décroissance quotidienne automatique (−5 pts/jour par défaut)
- **Actions bonnes/mauvaises** à cocher pour gagner ou perdre des points (bonnes : 1×/jour, mauvaises : illimitées)
- **Groupes & classements** — créer/rejoindre des groupes, voir le karma des autres joueurs
- **Propositions d'actions** par les utilisateurs, validées par les admins
- **Rôles** : Utilisateur, Modérateur, Admin, Super Admin
- **CRUD actions** (modérateurs+) et **validation** (admins+)
- **Gestion des rôles** (super admins)

## Stack technique

| Couche | Techno |
|--------|--------|
| API | Fastify + Prisma + PostgreSQL |
| Front web | Next.js 14 + Tailwind + Framer Motion |
| Partagé | `@karma/shared` (types Zod/TS) |
| Auth | JWT |
| Infra | Docker Compose |

## Démarrage rapide (Docker / Podman)

```bash
docker compose up --build
# ou avec Podman :
podman-compose up --build
```

Puis initialiser les données de test :

```bash
docker compose --profile seed run --rm seed
# Podman :
podman-compose --profile seed run --rm seed
```

> **Note Podman (Windows)** : `podman-compose` 1.x ignore les chemins `dockerfile:` personnalisés (ex. `apps/api/Dockerfile`). Le projet utilise un `Dockerfile` unique à la racine avec des cibles `api` et `web`, compatible Docker Compose et podman-compose.

Accès :
- **Front** : http://localhost:3000
- **API** : http://localhost:3001/health

### Comptes de test (après seed)

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| superadmin@karma.local | admin123 | SUPER_ADMIN |
| admin@karma.local | admin123 | ADMIN |
| user@karma.local | user123 | USER |

## Développement local

```bash
npm install
npm run build -w @karma/shared

# Terminal 1 — BDD
docker compose up db

# Terminal 2 — API
cp apps/api/.env.example apps/api/.env
npm run db:migrate -w @karma/api
npm run db:seed -w @karma/api
npm run dev:api

# Terminal 3 — Front
cp apps/web/.env.example apps/web/.env.local
npm run dev:web
```

## Architecture monorepo

```
Karma/
├── apps/
│   ├── api/          # API REST Fastify
│   └── web/          # Front Next.js
├── packages/
│   └── shared/       # Types + schémas Zod partagés
└── docker-compose.yml
```

---

## Web + Mobile : propositions de stratégie

### Question Expo : peut-on extraire le web ?

**Oui, partiellement.** Expo supporte le web via `react-native-web` et Expo Router. Une seule codebase peut cibler iOS, Android et Web. Cependant :

- L'expérience **web** d'Expo est fonctionnelle mais souvent **moins riche** qu'un Next.js dédié (SEO, perf, animations CSS, routing avancé).
- Le code UI est en **React Native** (View, Text…), pas en HTML/CSS — le rendu web est une émulation.
- Pour un site gaming avec jauge animée et design soigné, **Next.js reste supérieur pour la phase web**.

### Recommandation retenue : **Monorepo hybride (Option A — recommandée)**

```
apps/web       → Next.js (web maintenant)
apps/mobile    → Expo (plus tard, quand besoin natif)
apps/api       → API REST partagée
packages/shared → types, validation, client API
packages/ui    → (optionnel) composants partagés si design system unifié
```

**Avantages :**
- Meilleure UX web dès maintenant
- API unique pour web et mobile
- Types et validation partagés (`@karma/shared` déjà en place)
- Mobile ajouté sans refonte backend

**Partage estimé : ~70 %** (API, types, logique métier) — seule la couche UI diffère.

### Option B : Expo partout (web + mobile d'un coup)

Une seule app Expo Router pour les 3 plateformes.

| Pour | Contre |
|------|--------|
| 1 seule UI | Web moins performant/beau |
| Zéro duplication UI | Courbe d'apprentissage RN |
| Notifications push faciles | Animations gaming plus limitées sur web |

**À choisir si** le mobile est la cible principale et le web secondaire.

### Option C : Deux codebases séparées (à éviter)

Next.js + React Native natif sans package partagé → double maintenance, bugs divergents. **Non recommandé.**

### Option D : PWA (Progressive Web App)

Transformer le Next.js actuel en PWA installable sur mobile.

| Pour | Contre |
|------|--------|
| Zéro app store | Pas de push natif iOS fiable |
| 1 seule codebase | Accès limité aux APIs natives |
| Déploiement instantané | Sensation moins "app native" |

**Bon compromis** si l'app mobile n'a pas besoin de fonctionnalités natives avancées.

---

## Rôles et permissions

| Action | User | Modérateur | Admin | Super Admin |
|--------|------|------------|-------|-------------|
| Cocher actions | ✅ | ✅ | ✅ | ✅ |
| Proposer action | ✅ | ✅ | ✅ | ✅ |
| CRUD actions | ❌ | ✅ | ✅ | ✅ |
| Valider propositions | ❌ | ❌ | ✅ | ✅ |
| Gérer rôles | ❌ | ❌ | ❌ | ✅ |

## Variables d'environnement

### API (`apps/api/.env`)

| Variable | Défaut | Description |
|----------|--------|-------------|
| `DATABASE_URL` | — | Connexion PostgreSQL |
| `JWT_SECRET` | — | Secret JWT |
| `KARMA_DAILY_DECAY` | 5 | Points perdus par jour |
| `KARMA_MAX` | 100 | Plafond de karma |
| `CORS_ORIGIN` | http://localhost:3000 | Origine front autorisée |

### Web (`apps/web/.env.local`)

| Variable | Défaut | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_API_URL` | http://localhost:3001 | URL de l'API |

## Prochaines étapes suggérées

1. Ajouter `apps/mobile` (Expo) branché sur la même API
2. Cron job pour la décroissance quotidienne (actuellement à la connexion)
3. Notifications push (Expo) pour rappeler la décroissance
4. Classement / leaderboard entre joueurs
