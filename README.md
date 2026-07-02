# TaskList — Backend

API backend de l'application **TaskList**, construite avec **Node.js**, **Express**, **TypeScript** et **Prisma** (MySQL).

<!-- trigger test $(date) -->


## Stack technique

- **Runtime** : Node.js 20+
- **Framework** : Express 5
- **Langage** : TypeScript
- **ORM** : Prisma (MySQL)
- **Tests** : Vitest (unitaires + e2e), Supertest
- **Qualité de code** : SonarQube
- **Conteneurisation** : Docker (multi-stage build)
- **Sécurité** : Trivy (scan de vulnérabilités + SBOM)
- **Registre d'images** : DockerHub

## Installation

```bash
npm ci
npx prisma generate
```

## Lancer le projet en local

```bash
npm run dev
```

Le serveur démarre par défaut sur `http://localhost:3001`.

## Tests et couverture

```bash
# Génération du client Prisma pour l'environnement de test
npx prisma generate --schema=prisma/schema-test.prisma

# Tests unitaires
npm run test:coverage

# Tests end-to-end
npm run test:e2e:coverage
```

| Type de test | Couverture branches obtenue | Objectif |
|---|---|---|
| Unitaires | 92.1% | ≥ 80% |
| End-to-end | 82.35% | ≥ 70% |

Les rapports sont générés dans :
- `coverage/` (couverture lcov, consommée par SonarQube)
- `reports/` (résultats JUnit)

## Analyse de qualité (SonarQube)

```bash
sonar-scanner \
  -Dsonar.host.url=https://sonarqube.cicd.kits.ext.educentre.fr \
  -Dsonar.token=<TOKEN>
```

Configuration définie dans `sonar-project.properties`.

## Conteneurisation

### Build de l'image

```bash
docker buildx build --tag tasklist-backend:local --load .
```

Build multi-stage :
1. **builder** : installation des dépendances, génération du client Prisma, compilation TypeScript (`npm run build`)
2. **production** : image allégée, dépendances de production uniquement, code compilé uniquement (`dist/`)

### Scan de sécurité (Trivy)

```bash
trivy image --severity CRITICAL,HIGH --format table tasklist-backend:local
```

Résultat : **0 vulnérabilité CRITICAL**, vulnérabilités HIGH limitées aux outils internes de l'image de base (`npm`), sans impact sur le code applicatif (0 vulnérabilité sur les dépendances du projet).

### Génération des SBOM

```bash
trivy image --format spdx-json --output sbom-spdx.json tasklist-backend:local
trivy image --format cyclonedx --output sbom-cyclonedx.json tasklist-backend:local
```

### Publication sur DockerHub

```bash
docker login
docker buildx build \
  --platform linux/amd64 \
  --tag okidock/tasklist-backend:latest \
  --sbom=true \
  --provenance=true \
  --push \
  .
```

Image disponible sur : [hub.docker.com/r/okidock/tasklist-backend](https://hub.docker.com/r/okidock/tasklist-backend)

## API — Endpoints

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/tasks` | Liste toutes les tâches |
| GET | `/api/tasks/:id` | Récupère une tâche par son ID |
| POST | `/api/tasks` | Crée une nouvelle tâche |
| PUT | `/api/tasks/:id` | Met à jour une tâche existante |
| DELETE | `/api/tasks/:id` | Supprime une tâche |

## Structure du projet

src/

├── controllers/    # Logique de traitement des requêtes HTTP

├── services/       # Logique métier, accès aux données via Prisma

├── routes/         # Définition des routes Express

├── lib/            # Client Prisma partagé

└── tests/

├── unit/        # Tests unitaires (mocks)

└── e2e/         # Tests end-to-end (base de test réelle)