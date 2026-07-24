---
name: triage-dependabot-alerts
description: Triage Dependabot dependency-vulnerability alerts for activepieces/activepieces — dedupe to distinct (package, advisory), confirm the vulnerable API is actually used, and propose version bumps proven non-breaking before any PR. For human-reported vulns use triage-security-advisories instead.
---

# Triage Dependabot Alerts (dependency vulns)

On-demand triage of Dependabot alerts for `activepieces/activepieces`. Produces a review-ready report per affected package + proposes bumps **proven non-breaking** before any PR. Dependency CVEs are already public → normal PRs, no scope-check, no private-fork flow. (For human-reported vulns, use **triage-security-advisories**; they share the `.security-triage/` workspace.)

**Privacy:** write all artifacts to `.security-triage/` (gitignored). Never commit them.

## Step 1 — Fetch
```
gh api "/repos/activepieces/activepieces/dependabot/alerts?state=open" --paginate > .security-triage/dependabot.json
jq -s 'add' .security-triage/dependabot.json > .tmp && mv .tmp .security-triage/dependabot.json
```
**Validate it's an array** (`jq -e 'type=="array"'`) — a 404/403 body is `{message,...}` and `jq length`=3 looks like "3 alerts". If not an array, fetch failed = token scope: add `security_events` (`gh auth refresh -s security_events`, or a classic PAT with `repo`+`security_events`). Don't pre-gate — `repo` alone often works; try first.

## Step 2 — Dedupe, then validate usage
A backlog of 100s collapses to a few distinct vulns (same CVE reported once per manifest; single hoisted lockfile installs one copy). **Triage distinct (package, advisory), grouped by package** — one bump usually clears all alerts for a package. Default focus: **critical + high** (ask before medium/low).
- **Read ALL vulnerable ranges** per advisory (`vulnerabilities[]` has one entry per major line) — `vulnerabilities[0]` understates exposure.
- **Census the lockfile in the main thread** — `grep -oE '"<pkg>@[0-9][^"]*"' bun.lock | sort -u` (this repo is **bun**). Subagents under-count duplicate transitive copies; the lockfile is authoritative.
- Spawn one subagent **per package/advisory** (never per raw alert): confirm the package is a real dep + which manifests declare it (ignore `node_modules/**`); confirm the vulnerable **API is actually imported/exercised**; ground the installed version in the lockfile vs the advisory range (≥ one advisory's fix does NOT mean safe if another patches higher); note first-patched version; assess reachability.
- Verdicts: `AFFECTED` / `NOT_AFFECTED` / `NO_FIX_YET` / `DEV_ONLY`.

## Step 3 — Report
One markdown per affected package: `.security-triage/reports/dependabot-<package>.md` (advisories, ranges, installed→fix, verdict + call sites, alert IDs, recommendation). Then consolidated `.security-triage/DEPENDABOT-TRIAGE-SUMMARY.md` (verdict tally, table by severity+verdict, shared-dependency patterns). Present headline verdicts most-attacker-reachable first; keep DEV_ONLY separate.

## Step 4 — Fix on approval (bump PROVEN non-breaking)
**Single shared lockfile → ONE batched PR in one isolated worktree** (per-package branches conflict on the lockfile).
1. Worktree off HEAD. 2. Bump each dep to the first version clearing ALL its advisories (edit pinned range + `bun install`; exact pins → sed-sweep every manifest). 3. **Dedupe leftover copies carefully** — re-census: same-major our-tree copies → flat `resolutions` pin (bun honours only FLAT keys); cross-major inside a third-party SDK → do NOT force (can't prove non-breaking), document as residual. 4. A minor/patch bump is NOT automatically safe (types tighten) — never skip the build. 5. Read changelog for breaking changes. 6. Grep every API usage, adapt in the same PR. 7. `npx turbo run build lint test --filter=<pkg> …`. 8. **Triage failures against base** — re-run on HEAD; only green-on-base/red-after is yours. 9. Dep bump inside a versioned internal package (`packages/core/shared`, `packages/server/utils`) → patch-bump it too (once/branch). 10. Propose PR only if build/lint/tests pass; else report breakage + options; discard worktree on failure.

**NO_FIX_YET** → no bump; write a risk-acceptance/mitigation note. If the only fix depends on a third-party CDN at build time, flag the self-hosting rule.

Full procedure in the repo: `.agents/skills/triage-dependabot-alerts/SKILL.md`
