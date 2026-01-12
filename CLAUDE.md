# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **open-source fork of Activepieces** - an automation platform (Zapier alternative) built with TypeScript. This fork removes all enterprise/commercial code and telemetry to create a fully open-source, privacy-respecting version.

## Build System

This is an Nx monorepo using **pnpm** as the package manager. Node.js 20.19+ is required.

```bash
pnpm install                    # Install dependencies
pnpm start                      # Full dev environment (auto-setup + all services)
pnpm dev                        # GUI (port 4300) + API + Engine concurrently
pnpm dev:backend                # API + Engine only
pnpm serve:frontend             # React UI only
pnpm serve:backend              # API only
```

## Development Pieces

For local development, set `AP_DEV_PIECES` to build pieces from source:

```bash
# In packages/server/api/.env
AP_PIECES_SYNC_MODE=NONE
AP_DEV_PIECES=webhook,http,data-mapper,schedule,delay,approval,loops,branch,text,date-time,math,json,list,connections,forms,response
```

Pieces listed in `AP_DEV_PIECES` are built from `packages/pieces/community/` and loaded from `dist/packages/pieces/`.

## Testing

```bash
# Server API tests (CE tests only - EE tests removed)
nx test-unit server-api         # Unit tests only
nx test-ce server-api           # Community Edition integration tests
nx test server-api              # All server tests

# Other packages
nx test react-ui
nx test engine
nx test cli

# E2E tests
pnpm test:e2e                   # Playwright E2E tests

# Run a single test file
nx test-unit server-api --testPathPattern="path/to/test"
```

## Linting

```bash
nx lint <package-name>                    # Lint specific package
npx nx run-many --target=lint             # Lint all
npx nx run-many --target=lint --fix       # Lint and auto-fix
pnpm push                                 # Lint with fix + git push
```

ESLint rules forbid lodash imports - use native utilities instead.

## Database Migrations

```bash
nx db-migration server-api --name=<DESCRIPTIVE_NAME>   # Generate migration
nx db server-api -- migration:run -d packages/server/api/src/app/database/migration-data-source.ts
```

## Piece Development

Pieces are npm packages that provide integrations.

```bash
pnpm create-piece               # Create new piece (interactive)
pnpm create-action              # Add action to existing piece
pnpm create-trigger             # Add trigger to existing piece
pnpm sync-pieces                # Sync piece metadata
pnpm build-piece                # Build piece
pnpm publish-piece-to-api       # Publish to local API
```

## Architecture

```
packages/
├── cli/                    # CLI for piece creation and management
├── engine/                 # Sandboxed execution engine (isolated-vm)
├── react-ui/               # React + Vite + Tailwind frontend
├── server/
│   ├── api/                # Fastify backend (main entry point)
│   ├── shared/             # Shared server utilities
│   └── worker/             # BullMQ job queue worker
├── shared/                 # Shared TypeScript types and utilities
└── pieces/
    ├── community/          # 280+ community integration pieces
    └── custom/             # Custom pieces
```

**Tech Stack:**
- Frontend: React 18, Vite, Tailwind CSS 4, Radix UI, React Query
- Backend: Fastify 5, TypeORM, PostgreSQL, Redis, BullMQ
- Engine: isolated-vm for sandboxed code execution

**Edition:**
- CE (Community Edition) only - this fork is fully open source

## Commit Convention

Uses conventional commits enforced by commitlint:
```
type(scope): description
```
Types: feat, fix, docs, chore, refactor, test, etc.

## Key Environment Variables

- `AP_ENVIRONMENT` - prod/dev
- `AP_EXECUTION_MODE` - UNSANDBOXED/SANDBOX_PROCESS
- `AP_POSTGRES_*` - Database configuration
- `AP_REDIS_*` - Cache configuration
- `AP_TELEMETRY_ENABLED` - Always false (telemetry removed)
- `AP_PIECES_SYNC_MODE` - NONE/OFFICIAL_AUTO
- `AP_DEV_PIECES` - Comma-separated list of pieces to build from source

## Removed Features (from upstream)

The following upstream features have been removed in this fork:
- Enterprise Edition licensing and features
- Audit logs
- API keys management (platform-level)
- SSO (SAML, OAuth providers)
- Custom domains
- Project members with roles
- Git sync / project releases
- Signing keys
- Platform billing
- AppSumo integration
- OTP authentication
- Managed authentication
- Usage analytics/impact dashboard
- All telemetry and tracking
