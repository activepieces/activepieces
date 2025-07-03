# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Activepieces is an open-source automation platform (alternative to Zapier) built with Angular frontend, Node.js/Fastify backend, and TypeScript throughout. It's a monorepo managed with Nx workspace using npm as the package manager.

## Key Commands

### Development
- `npm run dev` - Start all development services (frontend, backend, engine, pieces)
- `npm run dev:frontend` - Start frontend + required backend services
- `npm run dev:backend` - Start backend + engine only
- `npm run serve:frontend` - Start frontend only (nx serve ui-core)
- `npm run serve:backend` - Start backend API only (nx serve server-api)
- `npm run serve:engine` - Start execution engine only (nx serve engine)

### CLI Commands
- `npm run cli` - Run the Activepieces CLI
- `npm run create-piece` - Create a new piece (integration)
- `npm run create-action` - Create a new action for a piece
- `npm run create-trigger` - Create a new trigger for a piece
- `npm run sync-pieces` - Sync pieces metadata
- `npm run publish-piece` - Publish a piece to npm

### Testing & Quality
- `nx test [project-name]` - Run tests for specific project
- `nx lint [project-name]` - Run linting for specific project
- `nx build [project-name]` - Build specific project
- Use Jest for unit testing, Playwright for e2e testing

## Architecture

### Monorepo Structure
The project uses Nx workspace with packages organized in `/packages/`:

**Core Applications:**
- `packages/ui/core/` - Main Angular frontend application
- `packages/server/api/` - Main Fastify backend API
- `packages/engine/` - Flow execution engine
- `packages/cli/` - Command-line interface

**Shared Libraries:**
- `packages/shared/` - Common utilities and types
- `packages/server/shared/` - Backend-specific shared code
- `packages/pieces/community/framework/` - Piece development framework

**Pieces (Integrations):**
- `packages/pieces/community/[piece-name]/` - Community pieces
- `packages/ee/pieces/[piece-name]/` - Enterprise pieces
- Each piece is a self-contained package with actions/triggers

**UI Feature Libraries:**
- `packages/ui/feature-*` - Angular feature modules (builder, dashboard, etc.)
- `packages/ui/common/` - Shared UI components
- `packages/ee/ui/` - Enterprise UI features

### Flow Architecture
- **Flows** - Automation workflows with triggers and actions
- **Pieces** - Integrations (like GitHub, Slack, etc.) containing actions/triggers
- **Engine** - Executes flows in isolated sandboxes
- **Builder** - Visual flow editor with drag-and-drop interface

### Key Technologies
- **Frontend**: Angular 17, NgRx for state management, Angular Material, TailwindCSS
- **Backend**: Node.js, Fastify, TypeORM, PostgreSQL/SQLite
- **Execution**: Isolated VM execution with `isolated-vm`
- **Build**: Nx monorepo, esbuild/webpack, Jest testing

## Development Workflow

### Creating New Pieces
1. Use `npm run create-piece` to scaffold a new piece
2. Implement actions/triggers in the piece's `src/` directory
3. Follow the pieces framework API in `@activepieces/pieces-framework`
4. Test using the flow builder interface

### Working with UI Features
- Angular features are modularized in separate packages
- Use NgRx for state management patterns
- Follow existing component patterns in `packages/ui/common/`

### Backend Development
- API endpoints in `packages/server/api/`
- Business logic in `packages/server/shared/`
- Database entities and migrations managed with TypeORM

## Testing

### Unit Tests
- Run `nx test [package-name]` for specific package tests
- Jest configuration in individual `jest.config.ts` files
- Test files use `.spec.ts` extension

### E2E Tests
- Playwright tests in `packages/tests-e2e/`
- Run with appropriate nx commands for e2e testing

### Flow Testing
- Use the flow builder's test functionality
- Engine tests in `packages/engine/test/`

## Code Standards

### TypeScript Configuration
- Shared base config in `tsconfig.base.json`
- Path mapping for all packages configured
- Strict TypeScript settings enabled

### Linting & Formatting
- ESLint configuration in `.eslintrc.json`
- Prettier for code formatting
- Run `nx lint` for linting specific packages

## Important Notes

- **Package Manager**: Uses npm (not yarn) - `package-lock.json` is the lockfile
- **Pieces are Versioned**: Each piece is published to npm independently
- **Nx Caching**: Build and test results are cached for performance
- **Enterprise Features**: Located in `packages/ee/` with separate licensing
- **Database**: Supports both PostgreSQL (production) and SQLite (development)
- **Execution Isolation**: Flows run in secure isolated VMs for safety

## Common Patterns

### Piece Development
- Actions and triggers follow the pieces framework API
- Authentication handled through piece auth configurations
- Properties define user-configurable inputs

### UI Development
- Feature modules are standalone Angular packages
- State management with NgRx follows established patterns
- Components use Angular Material + custom styling

### API Development
- Fastify plugins for route organization
- TypeBox for schema validation
- Database access through TypeORM repositories