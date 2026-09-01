---
title: Console
icon: 🎛️
---

# Console

The internal admin dashboard, in its **own repo** (`activepieces/console`, private). Not
customer-facing except for one corner, the Portal. It holds the Autumn master key, mints license
keys, and is what support and sales actually look at. Activepieces talks to it over
`AUTUMN_CONSOLE_URL` — see [EE Platform (Plans & Billing)](./ee-platform-plans-billing.md) for
that contract.

Small: Nx monorepo, bun, three packages, about 8.6k lines of server and 12.4k of web.

**Main DB** — the Supabase project holding `license_keys`, `key_history`, `admin_access`,
`usage_snapshots`, `usage_limits`, `billing_periods`, `invoices`, read through `supabaseAdmin()`.
**Chat-analytics DB** — a *second, separate* Supabase project holding `conversations`,
`conversation_scores`, `audit_log`, read through `chatAnalyticsSupabaseAdmin()`.
**Architecture A+** — the repo's own name for that split: one codebase, a separate Supabase
project per sensitive module. DB-level isolation without microservices.
**Portal** — the customer-facing half at `/portal`. Sign in with email + license key, get a
self-signed JWT, see your own usage read-only. Easy to forget this repo is not purely internal.

## Stack

| Layer | What |
|---|---|
| Server | Fastify 5 + `fastify-type-provider-zod` + `@supabase/supabase-js`. Runs `.ts` under `tsx`, **no bundler** — so its `build` target is `tsc --noEmit`, a typecheck. |
| Web | React 19, react-router 7 (`BrowserRouter`, not framework mode), Vite 6, Tailwind 4, TanStack Query 5, shadcn/ui on Radix. One flat routes file, no lazy loading. |
| Shared | Plain TS + zod, no build step, imported as source. |
| Ports | web **5757**, API **5858**. |

One container serves both: the server registers `@fastify/static` on `packages/web/dist` when it
exists, with a not-found handler returning `index.html`.

A feature is three files — `<name>-module.ts` (owns the prefix), `<name>-controller.ts` (routes,
with the route option consts *below* the controller), `<name>-service.ts` (all Supabase access).

## Auth — four kinds, not one

| Hook | Caller | Credential |
|---|---|---|
| `supabaseAuthHook` | a person in the admin UI | Google OAuth via Supabase, then an `admin_access` row lookup |
| `apiKeyAuthHook` | machines | shared secret `AP_API_SECRET_KEY`, constant-time compare |
| `licenseKeyAuthHook` | AP instances pushing usage | the license key itself as Bearer |
| `portalAuthHook` | customers | self-signed JWT from `AP_PORTAL_JWT_SECRET` |

Login is **Google only** — there is no password path. `assertAdmin` is a separate role check on
top. `AP_DEV_AUTH_BYPASS` + `VITE_DEV_AUTH_BYPASS` disables all admin auth for local work.

## Gotchas

- **`core/migrations.ts` does not run migrations.** It probes each declared table/column with a
  `head: true` select and, when one is missing, **logs the SQL for a human to paste into the
  Supabase SQL Editor**. Nothing is ever executed. Repeated "Migration pending" lines in the logs
  are the app asking you to go run DDL by hand. The chat-analytics DB has no detector at all —
  its schema is a checked-in `chat-analytics-schema.sql` applied manually.
- **There is no ORM and no Postgres connection.** Every query is HTTP to PostgREST with the
  `service_role` key; the DB password is unused. So no transactions, no hand-written joins, and
  `ilike` values must be escaped yourself via `supabase-utils.ts`. There is also no generated
  `Database` type — the client is untyped and zod at the route boundary is the only enforcement.
- **Never mix the two Supabase clients.** Customer chat data must never reach the main project.
  A wrong `supabaseAdmin()` in a chat module is a data-isolation break, not a bug.
- **The deploy is not in the repo.** Only a `Dockerfile`, a compose file, and a CI job that lints,
  typechecks and tests. Where it runs is configured elsewhere — the org's pattern for internal
  tools is a DigitalOcean droplet driven by Actions over SSH, which you have to read out of
  `activepieces/discover`'s `deploy.yml`.
- **The Dockerfile sets `PORT`, which the server never reads** (it reads `AP_PORT`, default 5858).
  That line is dead unless the platform injects `AP_PORT` separately.
- **Config features belong in `config-console`, not here** — see decision
  [000033](../decisions/000033-ai-prices-are-published-to-the-cdn-from-a-second-console.md).

## Key files

- `packages/server/api/src/app/app.ts` — every route prefix in one place
- `packages/server/api/src/app/core/auth/` — the four hooks
- `packages/server/api/src/app/core/migrations.ts` — the detector, not a runner
- `packages/server/api/src/app/modules/license-keys/` — the clearest three-file feature
- `packages/web/src/features/license-keys/` — the list + detail + dialog shape
- `packages/web/src/styles.css` — the whole design system; there is no `tailwind.config.js`
