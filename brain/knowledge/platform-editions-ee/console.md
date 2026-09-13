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
- **`supabase-js` needs Node 22 at runtime, and a Node 20 image fails only after login, never at boot.** `@supabase/realtime-js` (2.112+) asks for a global `WebSocket`, which Node ships unflagged from 22. `SupabaseClient`'s constructor builds a `RealtimeClient` whether or not you use realtime, so on `node:20-alpine` `createClient()` throws `Node.js detected but native WebSocket not found`. Because `supabaseAdmin()` is called lazily inside the request hook rather than at startup, the container boots, passes its health check and looks deployed — then every authenticated request 500s. The generic `INTERNAL_ERROR` body hides it; the stack is only in the Runtime Logs. Pin the runner stage to `node:22-alpine`.
- **"Access restricted to authorized admin accounts" does not mean your row is missing.** `supabase-auth-hook.ts` reads the `admin_access` row as `const { data: access } = await ...single()` and throws the `error` away, so a missing row, a missing *table*, and an RLS or PostgREST failure all end as the same 401. Before chasing the row, run `select * from admin_access;` in that project's SQL Editor — `relation does not exist` means the schema was never applied (nothing applies it for you; see the migrations gotcha above). If the row is there, compare the email exactly: the lookup is `.eq('user_email', email)` and Postgres text compare is case-sensitive, so `Louai@` never matches `louai@`. `ap-analytics` has the same hook and the same trap.
- **Never mix the two Supabase clients.** Customer chat data must never reach the main project.
  A wrong `supabaseAdmin()` in a chat module is a data-isolation break, not a bug.
- **Production config is a `.env` file on the box, not anything a cloud panel shows you.** There is no secret manager anywhere in the repo — no Doppler, Vault, 1Password or SOPS. The server just reads `process.env[prefix + prop]` (`AP_` for everything, `VITE_` for the two shared ones), and `docker/docker-compose.yml` feeds it with `env_file: ../.env`. So if the app runs on a droplet, DigitalOcean has no environment-variable UI to look in and never will — that is a DO App Platform feature, and a droplet is just a Linux box. To find the values, `docker exec <container> env | grep -E 'AP_|VITE_'`, which works whatever put them there. Check `ls -l .env` is `600` while you are in there: it holds `AP_SUPABASE_SERVICE_ROLE_KEY`, which is full read-write on the billing database.
- **`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not secrets and are not runtime config.** They are `ARG`s in the Dockerfile, so Vite substitutes them at *build* time and they ship inside the JavaScript the browser downloads — open any `assets/index-*.js` and search for `supabase.co` to read them without any server access. That is intended: the anon key is public by design, and RLS plus the `admin_access` lookup are the real protection. The consequence for CI is that both must be available as build-time secrets, not only on the server. Fastest way to identify which Supabase project an environment points at: open devtools and read the `*.supabase.co` subdomain off any request.
- **The deploy is not in the repo.** Only a `Dockerfile`, a compose file, and a CI job that lints,
  typechecks and tests. Where it runs is configured elsewhere — the org's pattern for internal
  tools is a DigitalOcean droplet driven by Actions over SSH, which you have to read out of
  `activepieces/discover`'s `deploy.yml`.
- **The server reads `AP_PORT` and ignores `PORT`, which breaks it on any PaaS.** Its Dockerfile even sets `ENV PORT=3000`, a line that does nothing. This is harmless on a droplet, where you choose the port, and fatal on DigitalOcean App Platform, Railway or Render: they inject `PORT` and health-check it, the app listens somewhere else, and the deploy fails with nothing but 'health check failed'. On App Platform the injected `PORT` is exactly the component's **HTTP Port** setting, so a port pinned in the image is only fatal when the two disagree — and because a boot crash from any missing required env var reports as the same 'health check failed', do not diagnose it as a port problem until the Runtime Logs say so. `ap-analytics` hit exactly this and fixed it by defaulting `PORT` into the prop (`AP_PORT` -> `PORT` -> a local default) and pinning nothing in the image. Do the same here before moving the console off a droplet.
  That line is dead unless the platform injects `AP_PORT` separately.
- **App Platform autodetect makes one component per `package.json`, so an Nx monorepo lands as three.** With no `.do/app.yaml` in the repo, DigitalOcean scans and creates a component for `packages/server`, `packages/web` and `packages/shared` — `ap-analytics` came out as two Web Services and a Function for what is a single container. Only one is right: the root `Dockerfile` already serves the API and the built web assets together (`@fastify/static` on `packages/web/dist` with an `index.html` fallback), so keep the component whose Source Directory is `/` and whose build is the Dockerfile, and destroy the rest. The auto-generated names (`<repo>2`, `<repo>3`) say nothing about which is which — check the Source tab, not the name. Committing a `.do/app.yaml` stops the guessing for good.
- **Config features belong in `ap-analytics` (the repo that calls itself "config console"), not here** — see decision
  [000033](../decisions/000033-ai-prices-are-published-to-the-cdn-from-a-second-console.md).

## Key files

- `packages/server/api/src/app/app.ts` — every route prefix in one place
- `packages/server/api/src/app/core/auth/` — the four hooks
- `packages/server/api/src/app/core/migrations.ts` — the detector, not a runner
- `packages/server/api/src/app/modules/license-keys/` — the clearest three-file feature
- `packages/web/src/features/license-keys/` — the list + detail + dialog shape
- `packages/web/src/styles.css` — the whole design system; there is no `tailwind.config.js`
