---
name: review-logging-patterns
description: Review code for logging patterns and suggest evlog adoption. Guides setup on Nuxt, Next.js, SvelteKit, Nitro, TanStack Start, React Router, NestJS, Express, Hono, Fastify, Elysia, oRPC, Cloudflare Workers, and standalone TypeScript. Detects console.log spam, unstructured errors, and missing context. Covers wide events, structured errors, drain adapters (Axiom, OTLP, HyperDX, PostHog, Sentry, Better Stack, Datadog), sampling, enrichers, and AI SDK integration (token usage, tool calls, streaming metrics, telemetry integration, cost estimation, embedding metadata).
license: MIT
metadata:
  author: HugoRCD
  version: "0.5"
---

# Review logging patterns

Review and improve logging patterns in TypeScript/JavaScript codebases. Transform scattered console.logs into structured wide events and convert generic errors into self-documenting structured errors.

## When to Use

- Setting up evlog in a new or existing project (any supported framework)
- Reviewing code for logging best practices
- Converting console.log statements to structured logging
- Improving error handling with better context
- Configuring log draining, sampling, or enrichment

## Quick Reference

| Working on...           | Resource                                                           |
| ----------------------- | ------------------------------------------------------------------ |
| Wide events patterns    | [references/wide-events.md](references/wide-events.md)             |
| Error handling          | [references/structured-errors.md](references/structured-errors.md) |
| Code review checklist   | [references/code-review.md](references/code-review.md)             |
| Drain pipeline          | [references/drain-pipeline.md](references/drain-pipeline.md)       |
| Audit logs              | [build-audit-logs](../build-audit-logs/SKILL.md) skill + [docs](https://www.evlog.dev/use-cases/audit/overview) |

## Audit logs

For security-sensitive actions (auth, billing, admin, data export), use evlog's audit layer — a typed `audit` field on wide events, not a parallel logger. See the **`build-audit-logs`** skill for end-to-end setup (`log.audit`, `withAudit`, denials, `auditEnricher`, `auditOnly`, `signed`, `mockAudit`).

```typescript
log.audit({
  action: 'invoice.refund',
  actor: { type: 'user', id: user.id },
  target: { type: 'invoice', id: invoice.id },
  outcome: 'success',
})
```

Docs: https://www.evlog.dev/use-cases/audit/overview

## Installation

```bash
npm install evlog
```

---

## Framework Setup

### Nuxt

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['evlog/nuxt'],
  evlog: {
    env: { service: 'my-app' },
    include: ['/api/**'],
  },
})
```

All evlog functions (`useLogger`, `createError`, `parseError`, `log`) are **auto-imported** — no import statements needed.

```typescript
// server/api/checkout.post.ts — no imports needed
export default defineEventHandler(async (event) => {
  const log = useLogger(event)
  log.set({ user: { id: user.id, plan: user.plan } })
  return { success: true }
})
```

Drain, enrich, and tail sampling use Nitro hooks in server plugins:

```typescript
// server/plugins/evlog-drain.ts
import { createAxiomDrain } from 'evlog/axiom'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('evlog:drain', createAxiomDrain())
})
```

Client transport (auto-configured Vue plugin):

```typescript
// nuxt.config.ts
evlog: {
  transport: { enabled: true },  // logs sent to /api/_evlog/ingest
}
```

Client-side: `log`, `setIdentity`, `clearIdentity` are auto-imported in components.

### Next.js

**Step 1: Create central config** — all exports come from here:

```typescript
// lib/evlog.ts
import type { DrainContext } from 'evlog'
import { createEvlog } from 'evlog/next'
import { createUserAgentEnricher, createRequestSizeEnricher } from 'evlog/enrichers'
import { createDrainPipeline } from 'evlog/pipeline'

const enrichers = [createUserAgentEnricher(), createRequestSizeEnricher()]
const pipeline = createDrainPipeline<DrainContext>({ batch: { size: 50, intervalMs: 5000 } })
const drain = pipeline(createAxiomDrain({ dataset: 'logs', apiKey: process.env.AXIOM_API_KEY! }))

export const { withEvlog, useLogger, log, createError } = createEvlog({
  service: 'my-app',
  sampling: {
    rates: { info: 10 },
    keep: [{ status: 400 }, { duration: 1000 }],
  },
  routes: {
    '/api/auth/**': { service: 'auth-service' },
    '/api/checkout/**': { service: 'checkout-service' },
  },
  keep: (ctx) => {
    const user = ctx.context.user as { premium?: boolean } | undefined
    if (user?.premium) ctx.shouldKeep = true
  },
  enrich: (ctx) => {
    for (const enricher of enrichers) enricher(ctx)
  },
  drain,
})
```

**Step 2: Wrap route handlers** with `withEvlog()`:

```typescript
// app/api/checkout/route.ts
import { withEvlog, useLogger } from '@/lib/evlog'

export const POST = withEvlog(async (request: Request) => {
  const log = useLogger()  // Zero arguments — uses AsyncLocalStorage
  log.set({ user: { id: 'user_123', plan: 'enterprise' } })
  log.set({ cart: { items: 3, total: 14999 } })
  return Response.json({ success: true })
})
```

**Step 3: Server Actions** — same `withEvlog()` wrapper:

```typescript
// app/actions.ts
'use server'
import { withEvlog, useLogger } from '@/lib/evlog'

export const checkout = withEvlog(async (formData: FormData) => {
  const log = useLogger()
  log.set({ action: 'checkout', source: 'server-action' })
  return { success: true }
})
```

**Step 4: Middleware** (optional — sets `x-request-id` + timing headers):

```typescript
// proxy.ts
import { evlogMiddleware } from 'evlog/next'
export const proxy = evlogMiddleware()
export const config = { matcher: ['/api/:path*'] }
```

**Step 5: Client Provider** — wrap root layout:

```tsx
// app/layout.tsx
import { EvlogProvider } from 'evlog/next/client'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <EvlogProvider service="my-app" transport={{ enabled: true, endpoint: '/api/evlog/ingest' }}>
          {children}
        </EvlogProvider>
      </body>
    </html>
  )
}
```

**Step 6: Client logging** — in any client component:

```tsx
'use client'
import { log, setIdentity, clearIdentity } from 'evlog/next/client'

setIdentity({ userId: 'usr_123' })
log.info({ action: 'checkout_click' })
clearIdentity()
```

**Step 7 (optional): Instrumentation** — startup + global `onRequestError` (SSR/RSC errors outside `withEvlog`). Use `defineNodeInstrumentation(() => import('./lib/evlog'))` in root `instrumentation.ts` to gate Node + cache the import, **or** write `register`/`onRequestError` manually — both are valid. For custom logic, wrap evlog’s `register`/`onRequestError` inside `lib/evlog.ts` (compose with your own init or metrics), then re-export.

Export `createInstrumentation()` from `lib/evlog.ts` alongside `createEvlog()`. See framework docs for coexistence with `lockLogger`.

**Step 8: Client ingest endpoint** — receives client logs:

```typescript
// app/api/evlog/ingest/route.ts
import { NextRequest } from 'next/server'

const VALID_LEVELS = ['info', 'error', 'warn', 'debug'] as const

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && new URL(origin).host !== host) {
    return Response.json({ error: 'Invalid origin' }, { status: 403 })
  }
  const body = await request.json()
  if (!body?.timestamp || !body?.level || !VALID_LEVELS.includes(body.level)) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const { service: _, ...sanitized } = body
  console.log('[CLIENT LOG]', JSON.stringify({ ...sanitized, service: 'my-app', source: 'client' }))
  return new Response(null, { status: 204 })
}
```

### SvelteKit

```typescript
// src/hooks.server.ts
import { initLogger } from 'evlog'
import { createEvlogHooks } from 'evlog/sveltekit'

initLogger({ env: { service: 'my-app' } })

export const { handle, handleError } = createEvlogHooks()
```

Access the logger via `event.locals.log` in route handlers or `useLogger()` from anywhere in the call stack:

```typescript
// src/routes/api/users/[id]/+server.ts
import { json } from '@sveltejs/kit'

export const GET = ({ locals, params }) => {
  locals.log.set({ user: { id: params.id } })
  return json({ id: params.id })
}
```

```typescript
import { useLogger } from 'evlog/sveltekit'

async function findUsers() {
  const log = useLogger()
  log.set({ db: { query: 'SELECT * FROM users' } })
}
```

Full pipeline with drain, enrich, and tail sampling:

```typescript
import { createAxiomDrain } from 'evlog/axiom'

export const { handle, handleError } = createEvlogHooks({
  include: ['/api/**'],
  drain: createAxiomDrain(),
  enrich: (ctx) => { ctx.event.region = process.env.FLY_REGION },
  keep: (ctx) => {
    if (ctx.duration && ctx.duration > 2000) ctx.shouldKeep = true
  },
})
```

### Nitro v3

```typescript
// nitro.config.ts
import { defineConfig } from 'nitro'
import evlog from 'evlog/nitro/v3'

export default defineConfig({
  modules: [evlog({ env: { service: 'my-api' } })],
})
```

```typescript
// routes/api/checkout.post.ts
import { defineHandler } from 'nitro/h3'
import { useLogger } from 'evlog/nitro/v3'

export default defineHandler(async (event) => {
  const log = useLogger(event)
  log.set({ action: 'checkout' })
  return { ok: true }
})
```

### TanStack Start

TanStack Start uses Nitro v3. Install evlog and add a `nitro.config.ts`:

```typescript
// nitro.config.ts
import { defineConfig } from 'nitro'
import evlog from 'evlog/nitro/v3'

export default defineConfig({
  experimental: { asyncContext: true },
  modules: [evlog({ env: { service: 'my-app' } })],
})
```

Add the error handling middleware to `__root.tsx`:

```typescript
// src/routes/__root.tsx
import { createMiddleware } from '@tanstack/react-start'
import { evlogErrorHandler } from 'evlog/nitro/v3'

export const Route = createRootRoute({
  server: {
    middleware: [createMiddleware().server(evlogErrorHandler)],
  },
})
```

Use `useRequest()` from `nitro/context` to access the logger:

```typescript
import { useRequest } from 'nitro/context'
import type { RequestLogger } from 'evlog'

const req = useRequest()
const log = req.context.log as RequestLogger
log.set({ user: { id: 'user_123' } })
```

### Nitro v2

```typescript
// nitro.config.ts
import { defineNitroConfig } from 'nitropack/config'
import evlog from 'evlog/nitro'

export default defineNitroConfig({
  modules: [evlog({ env: { service: 'my-api' } })],
})
```

Import `useLogger` from `evlog/nitro` in routes.

### NestJS

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common'
import { EvlogModule } from 'evlog/nestjs'

@Module({
  imports: [EvlogModule.forRoot()],
})
export class AppModule {}
```

`EvlogModule.forRoot()` registers a global middleware. Use `useLogger()` to access the request-scoped logger from any controller or service:

```typescript
import { useLogger } from 'evlog/nestjs'

async function findUsers() {
  const log = useLogger()
  log.set({ db: { query: 'SELECT * FROM users' } })
}
```

Full pipeline with drain, enrich, and tail sampling:

```typescript
import { createAxiomDrain } from 'evlog/axiom'

EvlogModule.forRoot({
  include: ['/api/**'],
  drain: createAxiomDrain(),
  enrich: (ctx) => { ctx.event.region = process.env.FLY_REGION },
  keep: (ctx) => {
    if (ctx.duration && ctx.duration > 2000) ctx.shouldKeep = true
  },
})
```

For async configuration with NestJS DI, use `forRootAsync()`:

```typescript
EvlogModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config) => ({
    drain: createAxiomDrain({ apiKey: config.get('AXIOM_API_KEY') }),
  }),
})
```

### Express

```typescript
import express from 'express'
import { initLogger } from 'evlog'
import { evlog, useLogger } from 'evlog/express'

initLogger({ env: { service: 'my-api' } })

const app = express()
app.use(evlog())

app.get('/api/users', (req, res) => {
  req.log.set({ users: { count: 42 } })
  res.json({ users: [] })
})
```

Use `useLogger()` to access the logger from anywhere in the call stack without passing `req`:

```typescript
import { useLogger } from 'evlog/express'

async function findUsers() {
  const log = useLogger()
  log.set({ db: { query: 'SELECT * FROM users' } })
}
```

Full pipeline with drain, enrich, and tail sampling:

```typescript
import { createAxiomDrain } from 'evlog/axiom'

app.use(evlog({
  include: ['/api/**'],
  drain: createAxiomDrain(),
  enrich: (ctx) => { ctx.event.region = process.env.FLY_REGION },
  keep: (ctx) => {
    if (ctx.duration && ctx.duration > 2000) ctx.shouldKeep = true
  },
}))
```

### Hono

```typescript
import { Hono } from 'hono'
import { initLogger } from 'evlog'
import { evlog, type EvlogVariables } from 'evlog/hono'

initLogger({ env: { service: 'my-api' } })

const app = new Hono<EvlogVariables>()
app.use(evlog())

app.get('/api/users', (c) => {
  const log = c.get('log')
  log.set({ users: { count: 42 } })
  return c.json({ users: [] })
})
```

Access the logger via `c.get('log')` in handlers. No `useLogger()` — use `c.get('log')` and pass it down explicitly, or use Express/Fastify/Elysia if you need `useLogger()` across async boundaries.

Structured errors: throw `createError()`, then in `app.onError` use `parseError()` and pass `parsed.status as ContentfulStatusCode` to `c.json()` (Hono types the status argument as `ContentfulStatusCode`, not `number`).

```typescript
import { createError, parseError } from 'evlog'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

app.onError((error, c) => {
  c.get('log').error(error)
  const parsed = parseError(error)
  return c.json(
    { message: parsed.message, why: parsed.why, fix: parsed.fix, link: parsed.link },
    parsed.status as ContentfulStatusCode,
  )
})
```

Full pipeline with drain, enrich, and tail sampling:

```typescript
import { createAxiomDrain } from 'evlog/axiom'

app.use(evlog({
  include: ['/api/**'],
  drain: createAxiomDrain(),
  enrich: (ctx) => { ctx.event.region = process.env.FLY_REGION },
  keep: (ctx) => {
    if (ctx.duration && ctx.duration > 2000) ctx.shouldKeep = true
  },
}))
```

### Fastify

```typescript
import Fastify from 'fastify'
import { initLogger } from 'evlog'
import { evlog, useLogger } from 'evlog/fastify'

initLogger({ env: { service: 'my-api' } })

const app = Fastify({ logger: false })
await app.register(evlog)

app.get('/api/users', async (request) => {
  request.log.set({ users: { count: 42 } })
  return { users: [] }
})
```

`request.log` is the evlog wide-event logger (shadows Fastify's built-in pino logger on the request). Fastify's pino logger remains accessible via `fastify.log`.

Use `useLogger()` to access the logger from anywhere in the call stack without passing `request`:

```typescript
import { useLogger } from 'evlog/fastify'

async function findUsers() {
  const log = useLogger()
  log.set({ db: { query: 'SELECT * FROM users' } })
}
```

Full pipeline with drain, enrich, and tail sampling:

```typescript
import { createAxiomDrain } from 'evlog/axiom'

await app.register(evlog, {
  include: ['/api/**'],
  drain: createAxiomDrain(),
  enrich: (ctx) => { ctx.event.region = process.env.FLY_REGION },
  keep: (ctx) => {
    if (ctx.duration && ctx.duration > 2000) ctx.shouldKeep = true
  },
})
```

### Elysia

```typescript
import { Elysia } from 'elysia'
import { initLogger } from 'evlog'
import { evlog, useLogger } from 'evlog/elysia'

initLogger({ env: { service: 'my-api' } })

const app = new Elysia()
  .use(evlog())
  .get('/api/users', ({ log }) => {
    log.set({ users: { count: 42 } })
    return { users: [] }
  })
  .listen(3000)
```

Use `useLogger()` to access the logger from anywhere in the call stack:

```typescript
import { useLogger } from 'evlog/elysia'

async function findUsers() {
  const log = useLogger()
  log.set({ db: { query: 'SELECT * FROM users' } })
}
```

Full pipeline with drain, enrich, and tail sampling:

```typescript
import { createAxiomDrain } from 'evlog/axiom'

app.use(evlog({
  include: ['/api/**'],
  drain: createAxiomDrain(),
  enrich: (ctx) => { ctx.event.region = process.env.FLY_REGION },
  keep: (ctx) => {
    if (ctx.duration && ctx.duration > 2000) ctx.shouldKeep = true
  },
}))
```

### React Router

```typescript
// react-router.config.ts
import type { Config } from '@react-router/dev/config'

export default {
  future: {
    v8_middleware: true,
  },
} satisfies Config
```

```typescript
// app/root.tsx
import { initLogger } from 'evlog'
import { evlog } from 'evlog/react-router'

initLogger({ env: { service: 'my-api' } })

export const middleware: Route.MiddlewareFunction[] = [
  evlog(),
]
```

Access the logger via `context.get(loggerContext)` in loaders and actions:

```typescript
// app/routes/api.users.$id.tsx
import { loggerContext } from 'evlog/react-router'

export async function loader({ params, context }: Route.LoaderArgs) {
  const log = context.get(loggerContext)
  log.set({ user: { id: params.id } })
  return { users: [] }
}
```

Use `useLogger()` to access the logger from anywhere in the call stack without passing context:

```typescript
import { useLogger } from 'evlog/react-router'

async function findUsers() {
  const log = useLogger()
  log.set({ db: { query: 'SELECT * FROM users' } })
}
```

Full pipeline with drain, enrich, and tail sampling:

```typescript
import { createAxiomDrain } from 'evlog/axiom'

export const middleware: Route.MiddlewareFunction[] = [
  evlog({
    include: ['/api/**'],
    drain: createAxiomDrain(),
    enrich: (ctx) => { ctx.event.region = process.env.FLY_REGION },
    keep: (ctx) => {
      if (ctx.duration && ctx.duration > 2000) ctx.shouldKeep = true
    },
  }),
]
```

### oRPC

```typescript
import { os } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { initLogger } from 'evlog'
import { evlog, withEvlog, type EvlogOrpcContext } from 'evlog/orpc'

initLogger({ env: { service: 'my-rpc' } })

const base = os.$context<EvlogOrpcContext>().use(evlog())

const router = {
  ping: base.handler(({ context }) => {
    context.log.set({ pinged: true })
    return { ok: true }
  }),
}

const handler = withEvlog(new RPCHandler(router))

export default async function fetch(request: Request) {
  const { matched, response } = await handler.handle(request, { prefix: '/rpc' })
  return matched ? response : new Response('Not Found', { status: 404 })
}
```

`withEvlog()` wraps the handler so each matched request emits one wide event; `os.use(evlog())` exposes `context.log` on every procedure that descends from `base` and tags the wide event with `operation` (the procedure path joined with `.`).

Use `useLogger()` to access the logger from utility modules:

```typescript
import { useLogger } from 'evlog/orpc'

async function chargeCard(amount: number) {
  const log = useLogger()
  log.set({ payment: { amount } })
}
```

Full pipeline with drain, enrich, and tail sampling:

```typescript
import { createAxiomDrain } from 'evlog/axiom'

const handler = withEvlog(new RPCHandler(router), {
  include: ['/rpc/**'],
  drain: createAxiomDrain(),
  enrich: (ctx) => { ctx.event.region = process.env.FLY_REGION },
  keep: (ctx) => {
    if (ctx.duration && ctx.duration > 2000) ctx.shouldKeep = true
  },
})
```

### Cloudflare Workers

```typescript
import { initWorkersLogger, createWorkersLogger } from 'evlog/workers'

initWorkersLogger({ env: { service: 'edge-api' } })

export default {
  async fetch(request: Request) {
    const log = createWorkersLogger(request)
    try {
      log.set({ route: 'health' })
      const response = new Response('ok', { status: 200 })
      log.emit({ status: response.status })
      return response
    } catch (error) {
      log.error(error as Error)
      log.emit({ status: 500 })
      throw error
    }
  },
}
```

### Vite Plugin (any Vite-based framework)

For any Vite-based project (SvelteKit, Astro, SolidStart, React+Vite, etc.), use the Vite plugin for auto-init, auto-imports, and build-time features:

```typescript
// vite.config.ts
import evlog from 'evlog/vite'

export default defineConfig({
  plugins: [
    evlog({
      service: 'my-app',
      autoImports: true,           // auto-import log, createEvlogError, parseError
      strip: ['debug'],            // remove log.debug() in production
      sourceLocation: true,        // inject file:line in dev + prod
      client: {                    // client-side logging
        transport: { endpoint: '/api/logs' },
      },
    }),
  ],
})
```

Server-side middleware (drain, enrich, keep, routes) is still configured in the framework integration (e.g., `evlog()` middleware for Hono/Express/SvelteKit). The Vite plugin handles build-time DX only.

### Standalone TypeScript

```typescript
import { initLogger, createRequestLogger } from 'evlog'

initLogger({ env: { service: 'my-worker', environment: 'production' } })

const log = createRequestLogger({ jobId: job.id })
log.set({ source: job.source, recordsSynced: 150 })
log.emit()  // Manual emit required in standalone
```

---

## Configuration Options

All options work in Nuxt (`evlog` key), Nitro (passed to `evlog()`), Next.js (`createEvlog()`), and standalone (`initLogger()`).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `env.service` / `service` | `string` | `'app'` | Service name in logs |
| `enabled` | `boolean` | `true` | Global toggle (no-ops when false) |
| `pretty` | `boolean` | `true` in dev | Pretty tree format vs JSON |
| `silent` | `boolean` | `false` | Suppress console output. Events still go to drains |
| `include` | `string[]` | All routes | Route glob patterns to log |
| `exclude` | `string[]` | None | Route patterns to exclude (takes precedence) |
| `routes` | `Record<string, { service }>` | -- | Route-specific service names |
| `minLevel` | `'debug' \| 'info' \| 'warn' \| 'error'` | `'debug'` | Hard threshold for the global `log` API and client `log` (not request wide events). Use `sampling.rates` for probabilistic volume on requests |
| `sampling.rates` | `object` | -- | Head sampling: `{ info: 10, warn: 50 }` (0-100%) |
| `sampling.keep` | `array` | -- | Tail sampling: `[{ status: 400 }, { duration: 1000 }]` |
| `drain` | `(ctx) => void` | -- | Drain callback (Next.js, standalone) |
| `enrich` | `(ctx) => void` | -- | Enrich callback (Next.js) |
| `keep` | `(ctx) => void` | -- | Custom tail sampling callback (Next.js) |
| `redact` | `boolean \| RedactConfig` | `true` in production | Enabled by default in production. `false` to disable. Object for fine-grained control |

### Nitro Hooks (Nuxt, Nitro v2/v3)

| Hook | When | Use |
|------|------|-----|
| `evlog:drain` | After enrichment | Send events to external services |
| `evlog:enrich` | After emit, before drain | Add derived context |
| `evlog:emit:keep` | During emit | Custom tail sampling logic |
| `close` | Server shutdown | Flush drain pipeline buffers |

---

## Drain Adapters

| Adapter | Import | Env Vars |
|---------|--------|----------|
| Axiom | `evlog/axiom` | `AXIOM_API_KEY`, `AXIOM_DATASET` |
| OTLP | `evlog/otlp` | `OTLP_ENDPOINT` (or `OTEL_EXPORTER_OTLP_ENDPOINT`) |
| HyperDX | `evlog/hyperdx` | `HYPERDX_API_KEY` (optional `HYPERDX_OTLP_ENDPOINT`; defaults to `https://in-otel.hyperdx.io`) |
| PostHog | `evlog/posthog` | `POSTHOG_API_KEY`, `POSTHOG_HOST` |
| Sentry | `evlog/sentry` | `SENTRY_DSN` |
| Better Stack | `evlog/better-stack` | `BETTER_STACK_SOURCE_TOKEN` |
| Datadog | `evlog/datadog` | `DD_API_KEY` or `DATADOG_API_KEY`, optional `DD_SITE` / `DATADOG_LOGS_URL` |
| File System | `evlog/fs` | None (local file system) |
| HTTP (browser ingest) | `evlog/http` | None (configure `endpoint` in code). `evlog/browser` is deprecated; same API, removed next major |

In Nuxt/Nitro, use the `NUXT_` prefix (e.g., `NUXT_AXIOM_API_KEY`) so values are available via `useRuntimeConfig()`. All adapters also read unprefixed variables as fallback.

Setup pattern per framework:

```typescript
// Nuxt/Nitro: server/plugins/evlog-drain.ts
import { createAxiomDrain } from 'evlog/axiom'
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('evlog:drain', createAxiomDrain())
})

// Hono / Express / Elysia: pass drain in middleware options
import { createAxiomDrain } from 'evlog/axiom'
app.use(evlog({ drain: createAxiomDrain() }))

// Fastify: pass drain in plugin options
import { createAxiomDrain } from 'evlog/axiom'
await app.register(evlog, { drain: createAxiomDrain() })

// NestJS: pass drain in module options
import { createAxiomDrain } from 'evlog/axiom'
EvlogModule.forRoot({ drain: createAxiomDrain() })

// Next.js: pass drain to createEvlog()
import { createAxiomDrain } from 'evlog/axiom'
import { createDrainPipeline } from 'evlog/pipeline'
const pipeline = createDrainPipeline<DrainContext>({ batch: { size: 50 } })
const drain = pipeline(createAxiomDrain())
// then: createEvlog({ ..., drain })

// Standalone: pass drain to initLogger()
initLogger({ env: { service: 'my-app' }, drain: createAxiomDrain() })
```

See [references/drain-pipeline.md](references/drain-pipeline.md) for batching, retry, and buffer overflow config.

---

## Enrichers

Built-in: `createUserAgentEnricher()`, `createGeoEnricher()`, `createRequestSizeEnricher()`, `createTraceContextEnricher()` — all from `evlog/enrichers`.

```typescript
// Nuxt/Nitro: server/plugins/evlog-enrich.ts
import { createUserAgentEnricher, createGeoEnricher } from 'evlog/enrichers'
export default defineNitroPlugin((nitroApp) => {
  const enrichers = [createUserAgentEnricher(), createGeoEnricher()]
  nitroApp.hooks.hook('evlog:enrich', (ctx) => {
    for (const enricher of enrichers) enricher(ctx)
  })
})

// Next.js: in lib/evlog.ts
createEvlog({
  enrich: (ctx) => {
    for (const enricher of enrichers) enricher(ctx)
    ctx.event.region = process.env.VERCEL_REGION
  },
})
```

---

## Auto-Redaction (PII Protection)

Built-in redaction scrubs sensitive data from wide events **before** console output and **before** any drain sees the data. **Enabled by default in production** (`NODE_ENV === 'production'`), disabled in development. Uses **smart partial masking** — preserving enough context for debugging.

```typescript
// Disable in production (opt-out)
evlog: { redact: false }

// Add custom paths on top of built-ins
evlog: {
  redact: {
    paths: ['user.password', 'headers.authorization'],
  }
}

// Only specific built-ins
evlog: {
  redact: {
    builtins: ['email', 'creditCard'],
  }
}

// No built-ins, only custom (uses flat [REDACTED] replacement)
evlog: {
  redact: {
    builtins: false,
    paths: ['user.ssn'],
    patterns: [/SECRET_\w+/g],
  }
}
```

**Built-in patterns** with smart masking output:

| Pattern | Example Input | Masked Output |
|---------|---------------|---------------|
| `creditCard` | `4111111111111111` | `****1111` |
| `email` | `alice@example.com` | `a***@***.com` |
| `ipv4` | `192.168.1.100` | `***.***.***.100` |
| `phone` | `+33 6 12 34 56 78` | `+33 ****5678` |
| `jwt` | `eyJhbGciOi...` | `eyJ***.***` |
| `bearer` | `Bearer sk_live_abc...` | `Bearer ***` |
| `iban` | `FR76 3000 6000 ...189` | `FR76****189` |

Works in all frameworks: Nuxt (`evlog` config), Nitro (`evlog()` module options), Next.js (`createEvlog()`), standalone (`initLogger()`), and all middleware integrations (Hono, Express, Fastify, Elysia, NestJS).

---

## AI SDK Integration

Capture token usage, tool calls, model info, streaming metrics, tool execution timing, cost estimation, and embedding metadata from the Vercel AI SDK into wide events. Import from `evlog/ai`. Requires `ai >= 6.0.0` as a peer dependency.

### Basic setup (middleware)

```typescript
import { createAILogger } from 'evlog/ai'

const log = useLogger(event) // or any RequestLogger
const ai = createAILogger(log)

const result = streamText({
  model: ai.wrap('anthropic/claude-sonnet-4.6'),  // accepts string or model object
  messages,
})
```

`ai.wrap()` uses model middleware to transparently capture all LLM calls. Works with `generateText`, `streamText`, and `ToolLoopAgent`.

### Telemetry integration (deeper observability)

For tool execution timing, success/failure tracking, and total generation wall time, add `createEvlogIntegration()`:

```typescript
import { createAILogger, createEvlogIntegration } from 'evlog/ai'

const ai = createAILogger(log)

const agent = new ToolLoopAgent({
  model: ai.wrap('anthropic/claude-sonnet-4.6'),
  tools: { searchWeb, queryDatabase },
  stopWhen: stepCountIs(5),
  experimental_telemetry: {
    isEnabled: true,
    integrations: [createEvlogIntegration(ai)],
  },
})
```

This adds `ai.tools` (per-tool `{ name, durationMs, success, error? }`) and `ai.totalDurationMs` to the wide event.

### Embeddings

```typescript
const { embedding, usage } = await embed({ model: embeddingModel, value: query })
ai.captureEmbed({ usage, model: 'text-embedding-3-small', dimensions: 1536 })
```

For `embedMany`, pass the batch count:

```typescript
ai.captureEmbed({ usage, model: 'text-embedding-3-small', count: documents.length })
```

### Cost estimation

Pass a pricing map to get `ai.estimatedCost` in the wide event:

```typescript
const ai = createAILogger(log, {
  cost: {
    'claude-sonnet-4.6': { input: 3, output: 15 },
    'gpt-4o': { input: 2.5, output: 10 },
  },
})
```

### Wide event `ai` field

Includes: `calls`, `model`, `provider`, `inputTokens`, `outputTokens`, `totalTokens`, `cacheReadTokens`, `reasoningTokens`, `finishReason`, `toolCalls`, `steps`, `msToFirstChunk`, `msToFinish`, `tokensPerSecond`, `error`, `tools` (via telemetry integration), `totalDurationMs` (via telemetry integration), `embedding` (via `captureEmbed`), `estimatedCost` (via `cost` option).

Anti-patterns to detect:

| Anti-Pattern | Fix |
|--------------|-----|
| Manual token tracking in `onFinish` | `ai.wrap()` — middleware captures automatically |
| `console.log('tokens:', result.usage)` | `ai.wrap()` — structured `ai.*` fields in wide event |
| No AI observability | Add `createAILogger(log)` + `ai.wrap()` |
| No tool execution timing | Add `createEvlogIntegration(ai)` to `experimental_telemetry.integrations` |
| Manual cost calculation | Use `cost` option in `createAILogger()` |

---

## Structured Errors

```typescript
import { createError } from 'evlog'  // or auto-imported in Nuxt

// Minimal
throw createError({ message: 'Database connection failed', status: 500 })

// Standard
throw createError({ message: 'Payment failed', status: 402, why: 'Card declined by issuer' })

// Complete
throw createError({
  message: 'Payment failed',
  status: 402,
  why: 'Card declined by issuer - insufficient funds',
  fix: 'Please use a different payment method or contact your bank',
  link: 'https://docs.example.com/payments/declined',
  cause: originalError,
})

// Backend-only context (wide events / drains — never HTTP body or parseError())
throw createError({
  message: 'Not allowed',
  status: 403,
  why: 'Insufficient permissions',
  internal: { correlationId: 'req_abc', resourceId: 'proj_123' },
})
```

Frontend — extract user-facing fields with `parseError()` (`internal` is never returned to clients):

```typescript
import { parseError } from 'evlog'

const error = parseError(err)
// error.message, error.status, error.why, error.fix, error.link
```

See [references/structured-errors.md](references/structured-errors.md) for common patterns and templates.

---

## Anti-Patterns to Detect

| Anti-Pattern | Fix |
|--------------|-----|
| Multiple `console.log` in one function | Single wide event with `log.set()` |
| `throw new Error('...')` | `throw createError({ message, status, why, fix })` |
| `console.error(e); throw e` | `log.error(e); throw createError(...)` |
| No logging in request handlers | Add `useLogger(event)` / `useLogger()` / `createRequestLogger()` |
| Flat log data `{ uid, n, t }` | Grouped objects: `{ user: {...}, cart: {...} }` |
| Logging sensitive data `log.set({ user: body })` | Explicit fields: `{ user: { id: body.id, plan: body.plan } }` + enable `redact: true` |
| Putting support-only IDs in `why` / `message` | Use `createError({ ..., internal: { ... } })` for non-user-facing diagnostics |

See [references/code-review.md](references/code-review.md) for the full checklist.

---

## Loading Reference Files

Load based on what you're working on — **do not load all at once**:

- Designing wide events → [references/wide-events.md](references/wide-events.md)
- Improving errors → [references/structured-errors.md](references/structured-errors.md)
- Full code review → [references/code-review.md](references/code-review.md)
- Drain pipeline setup → [references/drain-pipeline.md](references/drain-pipeline.md)
