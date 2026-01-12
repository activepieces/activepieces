# Activepieces Community Edition (Fork)

An open-source fork of [Activepieces](https://github.com/activepieces/activepieces) - an automation platform (Zapier alternative) with all enterprise/commercial code and telemetry removed.

## What is This Fork?

This is a **fully open-source, privacy-respecting** version of Activepieces. All proprietary Enterprise Edition (EE) code has been removed, leaving only the MIT-licensed Community Edition.

### Removed from Upstream

| Category | What Was Removed |
|----------|------------------|
| **Enterprise Code** | `packages/ee/` and `packages/server/api/src/app/ee/` directories |
| **Telemetry** | Segment Analytics, PostHog - no usage tracking |
| **SSO** | SAML, Google OAuth federated authentication |
| **Billing** | Stripe integration, license keys, AppSumo |
| **EE Features** | Audit logs, API keys, project roles, git sync, custom domains, signing keys |

### Security Improvements

- SSL/TLS certificate validation enabled by default (removed `NODE_TLS_REJECT_UNAUTHORIZED=0`)
- No external telemetry or analytics calls

---

## Requirements

- **Node.js** 20.19+
- **pnpm** (package manager)
- **PostgreSQL** 14+
- **Redis** 6+

---

## Quick Start

### 1. Start PostgreSQL and Redis

```bash
# Start database services
docker-compose -f docker-compose.dev.yml up -d
```

This starts:
- **PostgreSQL** on `localhost:5432` (user: `postgres`, password: `A79Vm5D4p2VQHOp2gd5`, database: `activepieces`)
- **Redis** on `localhost:6379`

### 2. Configure Environment

The development `.env` file is already configured at `packages/server/api/.env` with credentials matching `docker-compose.dev.yml`.

If you need to reset it, the key settings are:

```bash
# Database (matches docker-compose.dev.yml)
AP_POSTGRES_HOST=localhost
AP_POSTGRES_PORT=5432
AP_POSTGRES_DATABASE=activepieces
AP_POSTGRES_USERNAME=postgres
AP_POSTGRES_PASSWORD=A79Vm5D4p2VQHOp2gd5

# Redis
AP_REDIS_HOST=localhost
AP_REDIS_PORT=6379
```

### 3. Install and Run

```bash
# Install dependencies
pnpm install

# Start everything (recommended for first run)
pnpm start
```

This runs the auto-setup and starts all services.

### 4. Access the Application

- **Frontend**: http://localhost:4200
- **API**: http://localhost:3000

---

## Running Individual Components

### Full Development Environment

```bash
pnpm dev                    # Frontend (4200) + API + Engine
```

### Frontend Only (React UI)

```bash
pnpm serve:frontend         # http://localhost:4200
```

The React UI built with Vite, Tailwind CSS 4, and Radix UI.

### Backend Only (API Server)

```bash
pnpm serve:backend          # http://localhost:3000
```

The Fastify API server with TypeORM and PostgreSQL.

### Backend + Engine (No Frontend)

```bash
pnpm dev:backend            # API + Engine workers
```

---

## Environment Configuration

The environment file is located at `packages/server/api/.env`.

### Key Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AP_POSTGRES_HOST` | PostgreSQL host | `localhost` |
| `AP_POSTGRES_PORT` | PostgreSQL port | `5432` |
| `AP_POSTGRES_DATABASE` | Database name | `activepieces` |
| `AP_POSTGRES_USERNAME` | Database user | `postgres` |
| `AP_POSTGRES_PASSWORD` | Database password | (required) |
| `AP_REDIS_HOST` | Redis host | `localhost` |
| `AP_REDIS_PORT` | Redis port | `6379` |
| `AP_JWT_SECRET` | JWT signing secret | (required, 64 chars) |
| `AP_ENCRYPTION_KEY` | Encryption key | (required, 64 chars) |
| `AP_ENVIRONMENT` | `prod` or `dev` | `dev` |
| `AP_EXECUTION_MODE` | `UNSANDBOXED` or `SANDBOX_PROCESS` | `UNSANDBOXED` |

### Development Pieces

To develop pieces locally, set in `.env`:

```bash
AP_PIECES_SYNC_MODE=NONE
AP_DEV_PIECES=webhook,http,schedule,delay,loops,branch,text,json
```

Pieces listed in `AP_DEV_PIECES` are built from `packages/pieces/community/` instead of loaded from npm.

---

## Project Structure

```
packages/
├── cli/                    # CLI for piece creation
├── engine/                 # Sandboxed execution engine (isolated-vm)
├── react-ui/               # React + Vite frontend (port 4200)
├── server/
│   ├── api/                # Fastify backend (port 3000)
│   ├── shared/             # Shared server utilities
│   └── worker/             # BullMQ job queue worker
├── shared/                 # Shared TypeScript types
└── pieces/
    └── community/          # 280+ integration pieces
```

---

## Development Commands

### Building

```bash
nx build react-ui           # Build frontend
nx build server-api         # Build backend
```

### Testing

```bash
nx test-unit server-api     # Unit tests
nx test-ce server-api       # Community Edition integration tests
nx test react-ui            # Frontend tests
pnpm test:e2e               # Playwright E2E tests
```

### Linting

```bash
nx lint react-ui            # Lint frontend
nx lint server-api          # Lint backend
npx nx run-many --target=lint --fix  # Lint all with auto-fix
```

### Database Migrations

```bash
nx db-migration server-api --name=MyMigration  # Generate migration
```

---

## Creating Pieces (Integrations)

```bash
pnpm create-piece           # Create new piece (interactive)
pnpm create-action          # Add action to existing piece
pnpm create-trigger         # Add trigger to existing piece
```

---

## Docker

### Development (Database Only)

Start just PostgreSQL and Redis for local development:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL | 5432 | `postgres` / `A79Vm5D4p2VQHOp2gd5` |
| Redis | 6379 | (no auth) |

Stop services:
```bash
docker-compose -f docker-compose.dev.yml down
```

### Production (Full Stack)

Run the complete Activepieces stack:

```bash
# Create .env file with your configuration
cp .env.example .env
# Edit .env with your settings

# Start all services
docker-compose up -d
```

This starts:
- Activepieces application (port 8080)
- PostgreSQL database
- Redis cache

See `docker-compose.yml` for configuration.

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite, Tailwind CSS 4, Radix UI, React Query |
| **Backend** | Fastify 5, TypeORM, PostgreSQL, Redis, BullMQ |
| **Engine** | isolated-vm for sandboxed code execution |
| **Build** | Nx monorepo, pnpm, TypeScript |

---

## License

This fork is released under the [MIT License](LICENSE).

Based on [Activepieces](https://github.com/activepieces/activepieces) by the Activepieces team.

---

## Differences from Upstream

This fork maintains compatibility with upstream Activepieces Community Edition features while removing:

- All code under commercial/enterprise licenses
- All telemetry and usage tracking
- Enterprise-only features (SSO, audit logs, billing, etc.)

The fork can still run flows, use all 280+ community pieces, and provides the full automation builder experience.
