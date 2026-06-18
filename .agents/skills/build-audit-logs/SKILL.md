---
name: build-audit-logs
description: >-
  Build or review audit trails in TypeScript/JavaScript apps using evlog (pipelines, typed actions,
  denials, retention, compliance-style reviews). For application code, not for extending the evlog package.
---

# Build or Review an Audit System with evlog

For **application developers** who either need to add an audit trail to their product, or who already have one and want it reviewed. Walks through the design calls, the end-to-end implementation, and a review checklist for an existing setup.

This skill assumes the audit lives in **your app**. To extend the evlog package itself (new audit helper, new drain wrapper), see the contributor skills under `.agents/skills/`.

## Quick reference — call-site cheat sheet

When you already know the system is wired and just need to remember the API:

| Situation | Helper |
|---|---|
| Inside a request handler, action succeeded | `log.audit({ action, actor, target, outcome: 'success' })` |
| Inside a request handler, AuthZ denial | `log.audit.deny('reason', { action, actor, target })` |
| Standalone job / script / CLI (no request) | `audit({ action, actor, target, outcome })` |
| Auto-record success / failure / denied for a function | `withAudit({ action, target }, fn)` |
| Recording a state change | add `changes: auditDiff(before, after)` |
| Centralised typed action vocabulary | `defineAuditAction('invoice.refund', { target: 'invoice' })` |
| Asserting audits in tests | `mockAudit()` — `assertAudit()` or `toIncludeAuditOf()` |

`AuditFields` schema (always provide `action`, `actor`, `outcome`; `target` strongly recommended; the rest is filled in for you):

```ts
interface AuditFields {
  action: string                                  // 'invoice.refund'
  actor: { type: 'user' | 'system' | 'api' | 'agent', id: string, email?, displayName?, model?, tools?, reason?, promptId? }
  outcome: 'success' | 'failure' | 'denied'
  target?: { type: string, id: string, [k: string]: unknown }
  reason?: string
  changes?: { before?: unknown, after?: unknown, patch?: AuditPatchOp[] }
  causationId?: string
  correlationId?: string
  version?: number                                // defaults to AUDIT_SCHEMA_VERSION
  idempotencyKey?: string                         // auto-derived from action+actor+target+timestamp
  context?: { requestId?, traceId?, ip?, userAgent?, tenantId?, ... }   // filled by auditEnricher
  signature?: string                              // added by signed(drain, { strategy: 'hmac' })
  prevHash?: string                               // added by signed(drain, { strategy: 'hash-chain' })
  hash?: string                                   // added by signed(drain, { strategy: 'hash-chain' })
}
```

## What "audit logging" actually means

An audit log answers a forensic question: **who did what, on which resource, when, from where, with which outcome.** That's a different shape from observability logs, which is why the operational rules differ:

|                | Audit log                                       | Observability log                  |
| -------------- | ----------------------------------------------- | ---------------------------------- |
| Question       | "Who tried to do what, was it allowed?"         | "How did this request behave?"     |
| Sampling       | Never (force-keep)                              | Often (head + tail)                |
| Retention      | 1 – 7 years (compliance)                        | 30 – 90 days                       |
| Mutability     | Append-only, tamper-evident                     | Mutable, lossy                     |
| Audience       | Auditors, security, legal                       | Engineers                          |
| Storage        | Often dedicated (separate dataset / DB)         | Shared with telemetry              |

evlog ships the audit layer as a thin extension of its wide-event pipeline (a typed `audit` field on `BaseWideEvent` plus a few helpers and drain wrappers). The point is that you compose with the primitives the app already uses — same drains, same enrichers, same redact, same framework integration. There is no parallel system to maintain.

## Mental model

```text
log.audit(...) ──► sets event.audit ──► force-keep ──► auditEnricher ──► redact ──► every drain
                                                                                  └─► auditOnly(signed(fsDrain))
```

| Building block                              | Role                                                                | Required?               |
| ------------------------------------------- | ------------------------------------------------------------------- | ----------------------- |
| `log.audit()` / `audit()` / `withAudit()`   | Sets `event.audit` and force-keeps the event                        | Yes                     |
| `auditEnricher()`                           | Auto-fills `event.audit.context` (req / trace / ip / ua / tenantId) | Recommended             |
| `auditOnly(drain)`                          | Filters the drain to events with `event.audit` set                  | Recommended             |
| `signed(drain, ...)`                        | Adds tamper-evident integrity (HMAC or hash-chain)                  | Optional (compliance)   |
| `auditRedactPreset`                         | Strict PII preset for audit events                                  | Recommended             |
| `mockAudit()`                               | Captures audit events in tests                                      | Yes (in tests)          |

## Design calls before writing code

Make these explicit and write them down somewhere a security reviewer can find. Without a written rule, the system can't be audited — auditors look for the policy first, then the enforcement.

### 1. Where do audits live?

| Sink                              | Use when                                          | Trade-offs                                                                                  |
| --------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **FS** (`evlog/fs` + `signed`)    | Self-hosted, simple, you control the disk         | Manual rotation/backup; single-process unless you persist hash-chain `state` externally     |
| **Dedicated Axiom dataset**       | You already use Axiom                             | Easy queries, separate retention/billing; cost scales with volume                           |
| **Postgres / Neon / Aurora**      | You want SQL queries, joins with app data         | Need a schema, indexes, retention job; idempotency key prevents duplicates                  |
| **S3 + Object Lock**              | Append-only WORM compliance (HIPAA / FINRA)       | Read latency; pair with a queryable mirror (Athena)                                         |
| **Multiple sinks**                | Different audiences (engineers ↔ legal)           | Use `auditOnly` per sink; sinks fail in isolation by design                                 |

> **Rule of thumb.** Pick at least two: a queryable one (Axiom / Postgres) for day-to-day forensics + an append-only one (FS journal with hash-chain, or S3 Object Lock) as the compliance artefact. The two-drain pattern protects against vendor outages and admin mistakes on the queryable side.

### 2. Do you need integrity (`signed`)?

Yes if any of:

- A compliance framework requires tamper-evidence (SOC2 CC7, HIPAA §164.312(c)(1), PCI 10.5).
- The sink is mutable by engineers / admins.
- You may need to prove to a regulator that no events were modified after the fact.

Skip if:

- Sink is already WORM (S3 Object Lock, BigQuery append-only, Postgres with row-level immutability + monitored DDL).
- You're prototyping.

Strategies:

- `'hmac'` — per-event signature; quick to verify; rotate `secret` annually and embed a key id (extend `AuditFields`).
- `'hash-chain'` — sequence integrity; deleting a row breaks the chain forward; persist `state.{load,save}` if you run multiple processes (Redis is the typical store).

### 3. Multi-tenancy?

If the app is multi-tenant, **tenant isolation on every audit event is non-negotiable** — a query that mixes tenants is a privacy incident. Wire it once in the enricher:

```ts
auditEnricher({ tenantId: ctx => resolveTenant(ctx) })
```

Then either (a) partition the audit dataset by `audit.context.tenantId`, or (b) one sink per tenant if hard isolation is required. Never query audits without a tenant filter.

### 4. Retention

Pick a window per sink and document it. Enforce at the sink layer, not in app code — the sink already has audited mechanisms for it (lifecycle policies, `DELETE` jobs, dataset retention).

| Framework | Typical retention                                                   |
| --------- | ------------------------------------------------------------------- |
| SOC2      | 1 year minimum, 7 years recommended                                 |
| HIPAA     | 6 years                                                             |
| PCI DSS   | 1 year (3 months immediately accessible)                            |
| GDPR      | "As long as necessary" — see "GDPR vs append-only" below            |

How to enforce per sink:

- **FS**: `createFsDrain({ maxFiles })` + a daily compactor.
- **Postgres**: `DELETE FROM audit_events WHERE timestamp < now() - interval '7 years'` on a cron.
- **Axiom / Datadog / Loki**: dataset-level retention policy.

### 5. GDPR vs append-only

The right to be forgotten collides with audit immutability. Recommended pattern:

1. Keep audit rows immutable and chain-verified.
2. Encrypt PII fields (email, name, IP) with a per-actor key held outside the audit store.
3. To "forget" a user, delete their key. The audit row stays, the chain stays valid, the PII becomes unreadable (crypto-shredding).

A built-in `cryptoShredding` helper is on the roadmap; until then, encrypt in a custom enricher.

## Step-by-step buildout

### Step 1 — Wire the pipeline (one-time)

The wiring shape is the same in every framework: register `auditEnricher()` so `event.audit.context` gets `requestId`, `traceId`, `ip`, `userAgent`, and (if configured) `tenantId` automatically, then add a main drain plus an audit-only sink.

The minimal Nuxt / Nitro setup looks like this:

```ts
// server/plugins/evlog.ts
import { auditEnricher, auditOnly, signed } from 'evlog'
import { createAxiomDrain } from 'evlog/axiom'
import { createFsDrain } from 'evlog/fs'

export default defineNitroPlugin((nitroApp) => {
  const auditSink = auditOnly(
    signed(createFsDrain({ dir: '.audit/' }), { strategy: 'hash-chain' }),
    { await: true },
  )
  const main = createAxiomDrain({ dataset: 'logs' })

  nitroApp.hooks.hook('evlog:enrich', auditEnricher({
    tenantId: ctx => ctx.headers?.['x-tenant-id'],
  }))
  nitroApp.hooks.hook('evlog:drain', async (ctx) => {
    await Promise.all([main(ctx), auditSink(ctx)])
  })
})
```

For Hono, Express, Next.js, or standalone scripts / workers, see [`references/framework-wiring.md`](references/framework-wiring.md). The pattern is identical — only the framework integration helper changes.

### Step 2 — Define the action vocabulary

Audits get queried and alerted on by `audit.action`. A typo is a missing alert, so centralise the list:

```ts
// app/audit/actions.ts
import { defineAuditAction } from 'evlog'

export const InvoiceRefund = defineAuditAction('invoice.refund', { target: 'invoice' })
export const UserUpdate    = defineAuditAction('user.update',    { target: 'user' })
export const ApiKeyRevoke  = defineAuditAction('apiKey.revoke',  { target: 'apiKey' })
export const RolePromote   = defineAuditAction('role.promote',   { target: 'user' })
```

Naming conventions:

- `noun.verb` (`invoice.refund`, not `refundInvoice`).
- Past tense if the audit is logged after the fact (`invoice.refunded`); present tense when wrapped by `withAudit()` (which resolves the outcome itself).
- Lowercase, dot-delimited, no spaces.

### Step 3 — Instrument call sites

Three patterns, in order of preference:

**A. Wrap the action with `withAudit()`** — pure audit-worthy actions (refund, delete, role change, password reset). Outcome resolution is automatic, so you can't forget to log a denial or failure:

```ts
import { withAudit, AuditDeniedError } from 'evlog'

export const refundInvoice = withAudit({
  action: 'invoice.refund',
  target: ({ id }: { id: string }) => ({ type: 'invoice', id }),
})(async ({ id }, ctx) => {
  if (!ctx.actor) throw new AuditDeniedError('Anonymous refund denied')
  return db.invoices.refund(id)
})
```

Outcome resolution:

- `fn` resolves → `outcome: 'success'`.
- `fn` throws `AuditDeniedError` (or any error with `status === 403`) → `outcome: 'denied'`, error message becomes `reason`.
- Any other thrown error → `outcome: 'failure'`, then re-thrown.

**B. Manual `log.audit()` inside a handler** — when the audit is one of several decisions in a larger handler, or when you need to emit before the action completes:

```ts
const log = useLogger(event)

if (!user.canRefund(invoice)) {
  log.audit.deny('Insufficient permissions', {
    action: 'invoice.refund',
    actor: { type: 'user', id: user.id },
    target: { type: 'invoice', id: invoice.id },
  })
  throw createError({ status: 403 })
}

const after = await db.invoices.refund(invoice.id)

log.audit({
  action: 'invoice.refund',
  actor: { type: 'user', id: user.id, email: user.email },
  target: { type: 'invoice', id: after.id },
  outcome: 'success',
  changes: auditDiff(invoice, after),
})
```

**C. Standalone `audit()` for jobs / scripts** — no request, no logger. Same shape, no context auto-fill:

```ts
import { audit } from 'evlog'

audit({
  action: 'cron.cleanup',
  actor: { type: 'system', id: 'cron' },
  target: { type: 'job', id: 'cleanup-stale-sessions' },
  outcome: 'success',
})
```

### Step 4 — Add denial coverage

Auditors care most about denials — they're how you prove the policy is actually being enforced. Every authorisation check should have a paired `log.audit.deny()`. Pulling the deny into a single helper guarantees coverage parity with successes:

```ts
function authorize(actor, action, resource) {
  const allowed = policy.check(actor, action, resource)
  if (!allowed) {
    useLogger().audit.deny(`Policy denied ${action}`, {
      action,
      actor,
      target: { type: resource.type, id: resource.id },
    })
    throw createError({ status: 403 })
  }
}
```

### Step 5 — Redact

Apply `auditRedactPreset` (or merge it into the existing `RedactConfig`). It drops `Authorization` / `Cookie` headers and common credential field names (`password`, `token`, `apiKey`, `cardNumber`, `cvv`, `ssn`) wherever they appear inside `audit.changes.before` / `audit.changes.after`:

```ts
import { initLogger, auditRedactPreset } from 'evlog'

initLogger({
  redact: {
    paths: [...(auditRedactPreset.paths ?? []), 'user.password', 'user.token'],
  },
})
```

### Step 6 — Test it

`mockAudit()` captures audit events for assertions without going through any drain. Make the denial test mandatory in code review — untested denial paths are the most common cause of audit gaps:

```ts
import { mockAudit } from 'evlog'

it('refunds the invoice and records an audit', async () => {
  const captured = mockAudit()

  await refundInvoice({ id: 'inv_889' }, { actor: { type: 'user', id: 'u1' } })

  expect(captured.events).toHaveLength(1)
  expect(captured.toIncludeAuditOf({
    action: 'invoice.refund',
    target: { type: 'invoice', id: 'inv_889' },
    outcome: 'success',
  })).toBe(true)

  captured.restore()
})

it('denies refund for non-owners and records the denial', async () => {
  const captured = mockAudit()

  await expect(refundInvoice({ id: 'inv_889' }, { actor: null })).rejects.toThrow()

  expect(captured.toIncludeAuditOf({
    action: 'invoice.refund',
    outcome: 'denied',
  })).toBe(true)

  captured.restore()
})
```

### Step 7 — Production readiness checklist

Walk through this with a security stakeholder before declaring the system production-ready (the same checklist powers the review mode below):

- [ ] `auditEnricher` is registered on every framework integration.
- [ ] Every authorisation check has a paired `log.audit.deny()` (greppable).
- [ ] Every mutating endpoint either uses `withAudit()` or calls `log.audit()` explicitly.
- [ ] At least two sinks: one queryable (Axiom / Postgres) and one tamper-evident (FS + `signed` hash-chain, or S3 Object Lock).
- [ ] `auditRedactPreset` (or stricter) is in the global `RedactConfig`.
- [ ] Retention policy is documented per sink and enforced at the sink layer.
- [ ] Multi-tenant apps: `tenantId` is set on every audit event; queries always filter by tenant.
- [ ] Hash-chain `state.{load,save}` persists across process restarts (file / Redis / Postgres).
- [ ] HMAC `secret` rotation procedure is documented; `keyId` is embedded in `AuditFields` (extend via `declare module`).
- [ ] Tests include a denial path for every privileged action.
- [ ] Audit dataset access is itself logged — meta-auditing matters.

## Review an existing audit setup

When the user already has an audit system and wants it reviewed, work through the four passes below in order. Each pass tells you exactly what to grep, what to look for, and what to flag.

### Pass 1 — Pipeline wiring

Find where the logger is initialised and where drains / enrichers are registered:

```bash
rg -n "initLogger|defineNitroPlugin|createLogger|evlog:enrich|evlog:drain" --type ts
rg -n "auditEnricher|auditOnly|signed\(" --type ts
```

Flag if:
- `auditEnricher()` is missing → `event.audit.context` is empty, no requestId / IP / tenant correlation.
- An audit-only sink exists but is not wrapped in `auditOnly(...)` → main events leak into the audit dataset (privacy & cost incident).
- Only one drain → no tamper-evident copy. Acceptable only if the single sink is WORM (S3 Object Lock, BigQuery append-only, Postgres immutable).
- `signed()` is used without a persisted `state` while running multiple processes → hash-chain breaks across restarts / instances.
- `await: true` is missing on the audit-only sink → events may be lost on crash.

### Pass 2 — Coverage (call sites)

Inventory every mutating action and every authorisation check:

```bash
rg -n "log\.audit\(|log\.audit\.deny\(|withAudit\(|^.*audit\(" --type ts
rg -n "createError\(.*403|throw .*Forbidden|status:\s*403|statusCode:\s*403" --type ts
rg -n "(?i)\b(delete|update|create|refund|grant|revoke|promote|demote|reset|impersonate)\b.*async\s+function|defineEventHandler" --type ts
```

For each match, check:
- Mutating endpoint without a `log.audit()` or `withAudit()` → coverage gap.
- `403` / `Forbidden` thrown without a paired `log.audit.deny()` → silent denial. This is the single most common gap.
- `actor: { type: 'user', id: 'cron' }` or hard-coded actors in cron / queue handlers → wrong `actor.type`. Should be `'system'`, `'api'`, or `'agent'`.
- `actor.id` set to a session id or token instead of the stable user id → forensic ambiguity.
- `log.set({ audit: ... })` without using the helpers → bypasses force-keep, may be dropped by tail-sampling.
- `withAudit()` action name in present tense (`invoice.refund`) is fine; manual `log.audit()` after the fact should use past tense (`invoice.refunded`).

### Pass 3 — Redaction & integrity

```bash
rg -n "auditRedactPreset|RedactConfig|paths:\s*\[" --type ts
rg -n "auditDiff\(" --type ts
rg -n "strategy:\s*['\"](?:hmac|hash-chain)" --type ts
```

Flag if:
- `auditRedactPreset` is not merged into the global redact config → `Authorization`, `Cookie`, `password`, `token`, `apiKey`, `cardNumber`, `cvv`, `ssn` may leak through `audit.changes`.
- `auditDiff()` is called on objects containing PII fields not listed in `redactPaths` → leak in the patch payload.
- HMAC `secret` is hard-coded or read from `process.env.SECRET` without a rotation plan / `keyId` → events become unverifiable after rotation.
- Hash-chain `state` is in-memory only → chain restarts each process boot, breaking continuity.

### Pass 4 — Tests

```bash
rg -n "mockAudit\(|toIncludeAuditOf\(" --type ts
```

Flag if:
- No tests use `mockAudit()` → audit pipeline silently drifts unnoticed.
- Tests only assert success outcomes → denial paths can rot. Every privileged action should have at least one denied-outcome test.
- Tests assert against `RegExp` actions broadly → typos in `audit.action` slip through (an action typo is a missing alert in production).

### Reporting the findings

Group findings by severity for the user:

- **P0 (blocker)**: missing `auditOnly` wrap on an audit sink, missing `auditRedactPreset`, denials not logged, no tamper-evident sink in a regulated context.
- **P1 (compliance gap)**: missing tenant isolation, hash-chain state not persisted, no HMAC rotation, no denial test coverage.
- **P2 (hygiene)**: action naming inconsistency, in-line actor objects (should use `defineAuditAction`), missing `causationId` / `correlationId` on chained operations.

Then map each finding to the relevant step in the buildout above (e.g. P0 → Step 5 redact, P1 → Step 7 checklist) so the fix is unambiguous.

## Common pitfalls

- **Logging only successes.** Auditors care most about denials. Pair `log.audit()` with `log.audit.deny()` on every negative branch of every check.
- **Leaking PII through `changes`.** `auditDiff()` runs through `RedactConfig`, but only if the field paths are listed. Add `password`, `token`, `apiKey` once globally so it's never a per-call-site decision.
- **Treating audits as observability.** Don't sample, downsample, or summarise audit events. Force-keep is on by default — don't disable it.
- **Conflating `actor.id` with the session id.** `actor.id` is the stable user id (or system identity); correlate sessions via `context.requestId` / `context.traceId`.
- **Forgetting standalone jobs.** Cron, queue workers, CLIs trigger audit-worthy actions too — use `audit()` or `withAudit()`.
- **Faking the actor type.** `actor.type: 'user'` for cron jobs gets flagged in audits. Use `'system'`, `'api'`, or `'agent'` accurately.
- **Single global secret with no rotation.** HMAC keys must rotate; without a `keyId`, old events become unverifiable after rotation.
- **One drain that fails takes audits down.** Sinks must fail in isolation. The default `drain: [...]` array does this; if you wrap in `Promise.all`, don't throw on a single rejection — log it.

## Glossary

- **Action** — `audit.action`, the verb-on-noun identifier (`invoice.refund`).
- **Actor** — who/what performed the action (`user`, `system`, `api`, `agent`).
- **Target** — the resource the action was performed on.
- **Outcome** — `success`, `failure`, or `denied`.
- **Idempotency key** — auto-derived hash of `action + actor + target + timestamp`; safe retries across drains.
- **Causation id** — id of the action that caused this one (admin action → system reactions).
- **Correlation id** — shared by every action in one logical operation.
- **Hash-chain** — each event's `prevHash` matches the previous event's `hash`, forming a verifiable sequence.

## Reference

- Per-framework wiring (Hono, Express, Next.js, standalone): [`references/framework-wiring.md`](references/framework-wiring.md)
- Docs: [Audit logs overview](https://www.evlog.dev/use-cases/audit/overview) — source at [`apps/docs/content/4.use-cases/4.audit/`](../../../apps/docs/content/4.use-cases/4.audit/)
- Source: [`packages/evlog/src/audit.ts`](../../../packages/evlog/src/audit.ts)
- Tests: [`packages/evlog/test/core/audit.test.ts`](../../../packages/evlog/test/core/audit.test.ts)
