---
name: triage-security-advisories
description: Triage the GitHub privately-reported vulnerability backlog for Activepieces — pull repository security advisories from the Security tab, scope-check against SECURITY.md, deeply validate each, compute SLA status, and propose fix plans for review. Use when the user asks to triage security advisories, work the reported-vulnerability backlog, or check SLA on reported vulns. For Dependabot dependency alerts, use the triage-dependabot-alerts skill instead.
---

# Triage Security Advisories (reported vulnerabilities)

On-demand triage of privately-reported vulnerabilities in the Activepieces GitHub repo
(`activepieces/activepieces`) — the **repository security advisories** from the Security tab.
Produces a **review-ready** report per advisory + an SLA dashboard, and proposes fix plans.
The user reviews and decides per advisory: approve the fix / dismiss as out-of-scope / escalate.

For Dependabot dependency alerts, use the **triage-dependabot-alerts** skill. The two share the
`.security-triage/` workspace, the privacy rule, and the SLA script.

Follow the manual process this automates: `docs/handbook/engineering/playbooks/security-advisory-response.mdx`.

## HARD PRIVACY RULE — read first

This is a **public** repo. Private/embargoed advisory content MUST NOT be committed.
- Write all artifacts (fetched JSON, per-advisory reports, dashboard) to `.security-triage/`,
  which is gitignored. Never write advisory content into any tracked file.
- After a run, confirm `git status` shows nothing new under tracked paths.
- Fixes go to a **private-fork `security/<ghsa-id>` branch** per the playbook — never a public
  pre-embargo PR.

## One-time setup

The `gh` token needs security scopes or the advisory API returns 403. If step 1 returns 403,
tell the user to run:

```
gh auth refresh -s security_events,repo
```

## Step 1 — Fetch (deterministic)

```
mkdir -p .security-triage
gh api /repos/activepieces/activepieces/security-advisories --paginate > .security-triage/advisories.json
```

`gh api --paginate` may emit concatenated arrays (you'll see `jq` parse multiple top-level
values, e.g. lengths `100` then `5`); if so merge into one array (`jq -s 'add'`).
On 403, surface the setup command above and stop.

**zsh JSON footgun (hit this every run):** never pipe advisory rows through `echo`/`printf` into
`jq` — `echo "$row" | jq …` corrupts embedded control chars/backslashes and fails with
`Invalid string: control characters … must be escaped`. To split the merged array into one
input file per advisory, loop the ids and let `jq` read the source file directly each time
(no shell string round-trip):

```
mkdir -p .security-triage/input .security-triage/reports
for id in $(jq -r '.[] | select(.state=="triage" or .state=="draft") | .ghsa_id' .security-triage/advisories.json); do
  jq --arg id "$id" '.[] | select(.ghsa_id==$id) | {ghsa_id, cve_id, summary, severity, state, created_at, cvss: .cvss_severities, cwes: .cwe_ids, description}' \
    .security-triage/advisories.json > ".security-triage/input/${id}.json"
done
```

Then hand each subagent its `input/<ghsa>.json` path to read — keeps the (private, embargoed)
advisory body out of the orchestrator's context and out of subagent prompts.

No manual state filtering needed — the SLA script (step 4) excludes resolved advisories
(`closed`/`published`/`withdrawn`) by default. The actionable backlog is state `triage`
(newly reported, un-assessed → full pipeline) and `draft` (accepted, fix in flight → SLA-track
only). Use `--state triage` to focus on un-assessed only, or `--state all` to include resolved.
When the user asks for "triage state only", pass `--state triage` AND filter the input-file loop
above to `select(.state=="triage")`.

## Step 2 — Filter + scope-check

For each advisory, check it against the out-of-scope list in `SECURITY.md`: clickjacking on
non-sensitive pages, unauthenticated/logout/login CSRF, MITM/physical-access attacks, DoS,
content/text injection without an attack vector, email spoofing, missing DNSSEC/CAA/CSP,
non-sensitive cookie flags, deadlinks, `UNSANDBOXED` execution mode, special-char inputs with
no exploitable sink, capability-token guessing without a disclosure path, and pure
high-entropy-identifier (e.g. nanoid) guessing.

If a report matches an out-of-scope item, mark it `OUT_OF_SCOPE` with the exact SECURITY.md
clause and reasoning.

## Step 3 — Deep validate (one focused subagent per advisory)

Do NOT stop at "the report mentions X." For each in-scope advisory, trace the **full path from
entry point to sink** and gather evidence the user can agree with or overrule:

- **Treat the reporter's `file:line` AND stated mechanism as a hint, not ground truth.** Nearly
  every advisory this codebase produces has drifted citations — refactors move code
  (`packages/shared`→`packages/core/shared`), rewrites swap the sink (axios→native `fetch`,
  worker→sandbox), line numbers shift. Re-locate the sink on current `main` by symbol/string
  search. The vuln can be real while the cited location is stale, and the reported **root cause
  can be wrong** even when a bug exists nearby (e.g. a reported bypass mechanism turns out to be
  irrelevant and the real flaw is elsewhere on the path). Verify the *mechanism*, not just that
  "something looks off near there."
- Locate the actual sink (`file:line`) and every reachable route/caller that reaches it.
- Inspect the guards in between and decide if the vuln is truly **reachable for an attacker**,
  not merely present in source:
  - Auth: `securityAccess` config on the endpoint (every endpoint must have one).
  - Tenant isolation: queries must filter by `projectId` / `platformId`
    (`.claude/rules/data-isolation.md`); connections use `ArrayContains([projectId])`.
  - Input validation (zod schemas), and edition gating (`platformMustHaveFeatureEnabled`,
    EE-only paths) — `.claude/rules/edition-safety.md`.
  - SSRF: outbound HTTP should use `safeHttp` (`.claude/rules/safe-http.md`); a raw
    `fetch`/`axios.create` on user input is a real reachable sink.
- **Default-on vs opt-in, and which edition — this flips real severity.** Check: (a) which edition
  registers the module (the `app.ts` edition switch — many sinks are Cloud-only or EE-only); (b)
  whether the vulnerable path is default-enabled or behind an env flag (admin/debug UIs often are);
  (c) whether the *protective* mode is opt-in (e.g. an SSRF guard that only runs in a non-default
  network mode). A real bug reachable only in a
  non-default/opt-in or single-edition config is materially lower severity — say so.
- Confirm the affected **version range** against current `main` — already patched? did a
  refactor remove the sink? Use `git log -S'<sink string>'` / `git blame` to find the fix commit.
  If `ALREADY_MITIGATED`, record the **fix commit SHA + date** and compare it to the advisory's
  `created_at`: reports filed *after* the fix landed are common here (one critical was fixed ~5
  weeks before it was reported). The fix date drives the close-out message and proves "BREACHED"
  on the dashboard is stale.
- Cross-check CVSS 4.0 scoring inputs from the playbook (attack vector, privileges, user
  interaction, scope, CIA impact). Buckets: 0.1–3.9 low, 4.0–6.9 medium, 7.0–8.9 high,
  9.0–10 critical.
- Produce a concrete **PoC sketch / failing-test outline**, or state precisely why it cannot
  be triggered.

Emit exactly one **verdict** per advisory, each backed by `file:line` evidence:

| Verdict | Meaning |
| --- | --- |
| `CONFIRMED_EXPLOITABLE` | Reachable and exploitable as described. |
| `THEORETICAL` | Sink present but not reachable (guarded / not wired up). |
| `ALREADY_MITIGATED` | A guard or prior fix already blocks it. |
| `FALSE_POSITIVE` | Not a real vulnerability. |
| `OUT_OF_SCOPE` | Excluded by SECURITY.md. |

Also flag **duplicates** (same sink/root cause) and **systemic patterns** (one fix covers
several). For a large backlog, fan out one subagent per advisory in parallel, then synthesize.
Subagents stay read-only; they write a report file (`reports/<ghsa>.md`) and return a compact
verdict line; they never edit code. Only use the Workflow tool if the user explicitly opts into
multi-agent orchestration — otherwise use parallel `Agent` calls.

Fan-out tips that paid off:
- **Group advisories into root-cause clusters and give each subagent its sibling list** ("likely
  same sink as X; cross-check, validate only yours"). This is what surfaces duplicates and the
  systemic patterns — a subagent blind to its siblings can't dedupe.
- **Runtimes are very uneven** (single deep history-trace took ~30 min vs ~3 min typical, and a
  subagent may spawn its own sub-agent for git archaeology). Tell agents to prioritize the
  **current-`main` verdict** and treat exhaustive history as secondary.
- **Don't poll with `sleep`** (the harness blocks it). To wait for all reports, arm a background
  `until [ "$(ls .security-triage/reports/*.md | wc -l)" -ge N ]; do sleep 3; done` and let it
  notify on completion; collect the streamed verdict notifications meanwhile.

## Activepieces sink patterns — "looks guarded but isn't" (grep these first)

High-yield recurring footguns in this codebase. Each surfaced as a confirmed advisory; a repo-wide
grep for them catches the systemic cluster, not just the reported instance:

- **`securityAccess.project(..., undefined, ...)`** — passing `undefined` as the required
  permission. `grantAccess()` returns `true` on a nil permission (`rbac-service.ts`), so the route
  collapses to **membership-only** — any project member (incl. VIEWER) passes. Confirm a dedicated
  permission *exists and is deliberately withheld* (the route is a bug) vs. genuinely membership-
  only by design (e.g. piece-metadata reads). Compare against a sibling module that wires the
  permission correctly (git-sync does).
- **`securityAccess.publicPlatform([PrincipalType.USER])`** on a state-changing or platform-wide
  route where `platformAdminOnly` is required — `publicPlatform` sets `adminOnly:false`, so the
  admin assertion never runs; any authenticated member reaches it. Compare to audit-events /
  api-keys / signing-keys / global-connections, which all use `platformAdminOnly`.
- **TypeORM `.where()` called twice** — the second `.where()` **replaces** the first (use
  `.andWhere`). A `projectId` filter followed by `.where({ appName })` silently drops tenant
  isolation.
- **`projectIds @> '[]'::jsonb`** — empty-array JSONB containment is **TRUE for every row** in
  Postgres, so an absent/empty `projectIds` collapses the tenant filter to match everything.
- **`request.projectId` trusted under PLATFORM auth** — it is only populated for
  `AuthorizationType.PROJECT`; under `publicPlatform`/PLATFORM it is `undefined`, and downstream
  code that reads it as a scope key then "fails open".
- **Websocket handlers with no per-event RBAC** — the dispatcher validates only the *handshake*
  `projectId`; individual `addListener` handlers trust client-supplied `resourceId`/`flowVersionId`
  with no per-event permission or resource→project ownership check.
- **Egress not via `safeHttp`** — AI-provider/piece outbound calls using `pieces-common`
  `httpClient` (native `fetch`/undici) instead of `safeHttp`; user-controlled `baseUrl`/host/
  `resourceName` interpolated into a URL = SSRF. The in-process dns/socket guards are opt-in
  (non-default network mode) and best-effort — verify they actually classify the transport in use.
- **`NODE_TLS_REJECT_UNAUTHORIZED='0'`** set anywhere — a process-wide, persistent TLS-verification
  kill (its own CWE-295 defect regardless of the reported vuln).
- **`window.opener.postMessage(payload, '*')`** — wildcard targetOrigin leaks the payload (OAuth
  code) to any opener origin; receive-side origin checks do NOT mitigate the send side.
- **Identity matched by email alone** — federated login (`getIdentityByEmail`) / a global
  `user_identity` keyed only on email, with no provider/`sub`/NameID binding = cross-tenant
  account takeover surface.

## Step 4 — Score + SLA (deterministic)

```
npm run security:sla -- --source advisory                # excludes resolved by default
npm run security:sla -- --source advisory --state triage  # un-assessed backlog only
npm run security:sla -- --source advisory --state all     # include closed/published
```

Reads `.security-triage/advisories.json`, computes deadlines + status, writes
`.security-triage/sla.json` + `.security-triage/dashboard.md`. By default it drops
`closed`/`published`/`withdrawn` advisories; `--state <csv>` overrides. SLA clock starts at the
advisory **creation date**:

| Severity | Remediate within | DUE_SOON threshold |
| --- | --- | --- |
| Critical | 7 days | ≤ 2 days left |
| High | 30 days | ≤ 7 days left |
| Medium | 90 days | ≤ 14 days left |
| Low | best-effort (no hard deadline) | — |

Status buckets: `BREACHED` → `DUE_SOON` → `ON_TRACK` → `BEST_EFFORT` → `NEEDS_TRIAGE`
(unscored). Sorted most-urgent-first.

## Step 5 — Report

Write a per-advisory review-ready markdown file under `.security-triage/reports/<ghsa>.md`:
scope verdict, validity verdict + `file:line` evidence, the sink, PoC sketch, **reported vs
assessed severity** (note when deep-validation changes it; the SLA dashboard buckets by the
GitHub-reported severity), SLA deadline + status, recommendation.

Then write the consolidated **`.security-triage/TRIAGE-SUMMARY.md`** — this is the artifact the
user actually reviews. It must include:
- Verdict tally (how many CONFIRMED_EXPLOITABLE / THEORETICAL / ALREADY_MITIGATED /
  FALSE_POSITIVE / OUT_OF_SCOPE).
- A table grouped by severity/SLA status: GHSA, SLA status, verdict, sink `file:line`, one-line note.
- **Duplicates** called out (same sink/root cause → fix once).
- **Systemic patterns** — where one fix covers several advisories (e.g. a shared broken guard).
- Severity downgrades/upgrades from deep-validation.

Present the SLA dashboard + the summary's headline verdicts in chat. **Lead with the count of
`CONFIRMED_EXPLOITABLE & unpatched-on-main`, NOT the raw BREACHED count** — the dashboard buckets
by GitHub-reported severity and lumps in already-fixed advisories, so "24 BREACHED" badly
overstates the real backlog (a run can have 24 BREACHED but only ~15 actually actionable). State
explicitly that BREACHED is reported-severity-based and includes mitigated items, then give the
actionable list sorted by urgency.

## Step 6 — Fix on approval (never before the user approves)

After the user picks which advisories to fix, follow the playbook's private flow:
- Draft the patch + a **regression test** that fails before / passes after.
- Stage it on a `security/<ghsa-id>` branch (private fork), patch-bump only — never bundle
  features. Do not open a public PR before the embargo.

## Closing / responding to a reporter

The repository-security-advisory REST API exposes `state` (closeable via
`PATCH /repos/activepieces/activepieces/security-advisories/<ghsa-id> -f state=closed`) but
**no comments endpoint** — the conversation thread is UI-only. To respond with a reason, draft
the message, have the user paste it into the advisory page, THEN close (so the reporter sees
the reason, not a bare close notification).

## Output recap

Everything lands in `.security-triage/` (gitignored): `advisories.json`, `sla.json`,
`dashboard.md`, and one report per advisory. Nothing private is ever committed.
