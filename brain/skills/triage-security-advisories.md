---
name: triage-security-advisories
description: Triage the GitHub privately-reported vulnerability backlog for Activepieces — pull repo security advisories, scope-check against SECURITY.md, deeply validate reachability on current main, compute SLA status, and propose fix plans. For Dependabot dependency alerts use triage-dependabot-alerts instead.
---

# Triage Security Advisories (privately-reported vulns)

On-demand triage of privately-reported vulns in `activepieces/activepieces` (Security-tab repository advisories). Review-ready report per advisory + SLA dashboard + fix plans. User decides per advisory. Follows `docs/handbook/engineering/playbooks/security-advisory-response.mdx`.

## HARD PRIVACY RULE (public repo)
Embargoed content MUST NOT be committed. All artifacts → `.security-triage/` (gitignored); confirm `git status` shows nothing new under tracked paths after a run. Fixes go to a **private-fork `security/<ghsa-id>` branch** — never a public pre-embargo PR.

## Step 1 — Fetch
```
gh api /repos/activepieces/activepieces/security-advisories --paginate > .security-triage/advisories.json
```
Merge concatenated arrays (`jq -s 'add'`). On 403: `gh auth refresh -s security_events,repo`. Actionable states: `triage` (un-assessed → full pipeline) + `draft` (fix in flight → SLA-track only).
**zsh footgun:** never pipe advisory rows through `echo`/`printf` into `jq` (corrupts control chars). Split into per-advisory files by looping ids and letting `jq` read the source file directly — keeps embargoed bodies out of orchestrator/subagent context.

## Step 2 — Scope-check against SECURITY.md
Mark `OUT_OF_SCOPE` (with the exact clause) if it matches the excluded list: clickjacking on non-sensitive pages, login/logout CSRF, MITM/physical, DoS, content injection w/o vector, email spoofing, missing DNSSEC/CAA/CSP, non-sensitive cookie flags, deadlinks, `UNSANDBOXED` mode, special-char inputs w/o exploitable sink, capability-token/nanoid guessing w/o disclosure path.

## Step 3 — Deep validate (one subagent per advisory, read-only)
Trace the full entry→sink path. **The reporter's file:line AND mechanism are hints, not truth** — refactors move code (`packages/shared`→`packages/core/shared`), swap sinks (axios→fetch), shift lines; re-locate the sink on current `main` by symbol search; the root cause can be wrong even when a bug exists nearby. Check guards: `securityAccess`, tenant isolation (`projectId`/`platformId`, `ArrayContains`), zod validation, edition gating, SSRF (`safeHttp`). **Default-on vs opt-in and which edition flips real severity** — a bug reachable only in a non-default/single-edition config is lower severity. Confirm version range vs `main` (`git log -S` / `git blame`); if `ALREADY_MITIGATED` record fix SHA+date vs advisory `created_at` (reports filed after the fix are common). Score CVSS 4.0. Produce a PoC sketch or state why not triggerable.
Verdicts: `CONFIRMED_EXPLOITABLE` / `THEORETICAL` / `ALREADY_MITIGATED` / `FALSE_POSITIVE` / `OUT_OF_SCOPE`. Flag duplicates + systemic patterns. Give each subagent its root-cause sibling list so it can dedupe. Don't poll with `sleep` (harness blocks it) — arm a background `until` waiter.

### AP "looks guarded but isn't" sinks (grep these for the systemic cluster)
`securityAccess.project(..., undefined, ...)` (nil permission → membership-only); `securityAccess.publicPlatform([USER])` where `platformAdminOnly` needed (admin assertion skipped); TypeORM double `.where()` (second replaces first — drops tenant filter, use `.andWhere`); `projectIds @> '[]'::jsonb` (TRUE for every row); `request.projectId` trusted under PLATFORM auth (undefined → fails open); websocket handlers with no per-event RBAC; egress not via `safeHttp` (user-controlled baseUrl = SSRF); `NODE_TLS_REJECT_UNAUTHORIZED='0'`; `window.opener.postMessage(payload, '*')`; identity matched by email alone (cross-tenant takeover).

## Step 4 — SLA (deterministic)
`npm run security:sla -- --source advisory` (excludes resolved by default; `--state triage|all`). Writes `sla.json` + `dashboard.md`. Clock starts at advisory creation. Critical 7d / High 30d / Medium 90d / Low best-effort. Buckets: BREACHED→DUE_SOON→ON_TRACK→BEST_EFFORT→NEEDS_TRIAGE.

## Step 5 — Report
Per-advisory `reports/<ghsa>.md` (scope + validity verdict + file:line, sink, PoC, reported-vs-assessed severity, SLA, recommendation). Then `.security-triage/TRIAGE-SUMMARY.md` (verdict tally, table by severity/SLA, duplicates, systemic patterns, severity changes). **Lead with count of CONFIRMED_EXPLOITABLE & unpatched-on-main, NOT raw BREACHED** — BREACHED buckets by reported severity and includes already-mitigated items, so it overstates the backlog.

## Step 6 — Fix on approval
Draft patch + regression test (fails before/passes after) on private `security/<ghsa-id>` branch, patch-bump only, no public PR before embargo. Closing: REST API has `state` (PATCH to `closed`) but no comments endpoint — have the user paste the reason into the advisory UI, then close.

Full procedure in the repo: `.agents/skills/triage-security-advisories/SKILL.md`
