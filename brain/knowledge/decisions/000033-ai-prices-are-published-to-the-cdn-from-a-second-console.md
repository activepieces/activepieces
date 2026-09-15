---
icon: 🪙
status: accepted
---

# AI prices are published to the CDN from a second console

## Decision

Model tiers and credit weights move out of the code and into
`cdn.activepieces.com/ai/pricing.json`. A **new repo**, `activepieces/ap-analytics`, is where
marketing edits them and presses Publish. Activepieces fetches that file (1h TTL), keeps the last
good copy, and falls back to the constants shipped with the release. The existing billing console
is not touched.

There is **no database table for the prices**. The CDN file is the source of truth. Every publish
also writes `ai/pricing/history/<timestamp>-<email>.json`, which gives history and one-click undo
with no table.

## Context

Every price was a constant in the monorepo, so repricing one model meant a code change, a release
and a self-host upgrade. Marketing needed to do it themselves. Two problems fell out of that:
where the UI lives, and how the values travel.

The billing console already holds license keys, Autumn customers and money. Its own rule is
"Architecture A+: one codebase, separate Supabase project per sensitive module" — but that
separates only the **database**. It does not stop a config feature from breaking a deploy that
also serves billing, and it does not stop anyone (or any agent) editing files next to that code.

## Why

A second repo separates the code and the deploy, not just the data. Config work can move fast
without touching the repo that holds the master billing key.

Publishing to the CDN rather than serving a live console endpoint keeps **billing correctness off
the console's uptime**. The fetch/cache/backoff/stale-fallback code already existed and was proven
(`model-catalog.ts`), so the reader is a copy of a working thing rather than new machinery.
Rejected: AP calling a console API on every read, which would make a config tool an availability
dependency of charging customers.

No table because the CDN object already gives durable storage, and archive copies give history for
one extra upload call. Rejected: a versioned Postgres table, which is a migration, a schema and a
second copy of the truth for no gain.

The cost is propagation delay (about 65 minutes, from `max-age=300` plus a 1h in-process TTL) and
that publishing needs CDN write credentials in the new repo. The current key can write anything in
the bucket; a key scoped to `ai/pricing*` is the follow-up.

## Consequences

- **The pricing schema now lives in two repos** and they must match. `packages/shared/src/lib/ai-pricing/`
  in ap-analytics, `packages/server/utils/src/ai-pricing-catalog.ts` here. Change one without the
  other and Activepieces rejects the file and silently keeps serving the old prices.
- A price change is no longer visible in `git log` of this repo. The audit trail is the CDN history
  prefix.
- The reader **fails closed**: bad schema, no tiers, a missing default tier, or a weight outside
  1..10000 all fall back to the last good file, then to the release's own constants. CE and
  self-hosted keep working with zero setup. A short model list is no longer one of these cases —
  see [000036](000036-published-model-weights-layer-over-the-shipped-table.md).
- Publishing is blocked whenever the live file cannot be read, so a CDN outage can never overwrite
  prices nobody can see.
- **The two guards on publishing are not equally strict, which is easy to misread.** Reading the live
  `pricing.json` before a write fails *closed* (above). The separate check that every priced model id
  exists in `ai/model-catalog.json` fails *open*: when the catalog cannot be loaded,
  `ai-pricing-service.ts` logs 'The model catalog is unavailable, so model ids were not checked before
  publishing' and publishes anyway. So a typo in a model id can reach the CDN and then match nothing in
  production, which shows up as a model that is simply never priced rather than as an error.
- Config features from now on go in `ap-analytics`, not the billing console.
- **The repo is named `ap-analytics` on GitHub, but calls itself "config console" inside** — README,
  `CLAUDE.md` and the package names all say config-console. It was created as `config-console` and
  renamed on 2026-09-02. A clone made before the rename pushes into a 404; fix it with
  `git remote set-url origin git@github.com:activepieces/ap-analytics.git`.
- **Internal tools run on DigitalOcean, but not all the same way.** `activepieces/discover` uses a **droplet** driven by Actions over SSH (`.github/workflows/deploy.yml` — build, rsync, `pm2 reload`), with nginx and certbot in front. `ap-analytics` uses **App Platform** instead: DO builds the Dockerfile, redeploys on push by itself, and issues TLS, so there is no server to log into and the repo carries no deploy workflow at all. Neither repo says which it is, so check the DO dashboard before assuming. Runbook: `DEPLOYMENT.md` in ap-analytics.
