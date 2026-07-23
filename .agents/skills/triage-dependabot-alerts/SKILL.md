---
name: triage-dependabot-alerts
description: Triage Dependabot dependency vulnerability alerts for the Activepieces repo — pull open alerts, dedupe to distinct (package, advisory), confirm the vulnerable package + API is actually used, and propose version-bump fixes proven non-breaking (build + tests) before any PR. Use when the user asks to triage Dependabot alerts, work the dependency-vulnerability backlog, or bump vulnerable dependencies. For human-reported vulnerabilities, use the triage-security-advisories skill instead.
---

# Triage Dependabot Alerts (dependency vulnerabilities)

On-demand triage of Dependabot dependency alerts for `activepieces/activepieces`. Produces a
**review-ready** report per affected package, and proposes version-bump fixes that are **proven
non-breaking** before any PR. The user reviews and decides per package: approve the bump /
dismiss / escalate.

For human-reported vulnerabilities (Security tab advisories), use the
**triage-security-advisories** skill. The two share the `.security-triage/` workspace. Dependency
CVEs are already public, so there is no scope-check against SECURITY.md and fixes may use normal
PRs (not the private-fork flow).

## Privacy note

Write all artifacts to `.security-triage/` (gitignored). Dependabot data is less sensitive than
private reports, but keep the workspace consistent and never commit triage artifacts.

## Step 1 — Fetch (deterministic)

```
mkdir -p .security-triage
gh api -H "Accept: application/vnd.github+json" "/repos/activepieces/activepieces/dependabot/alerts?state=open" --paginate > .security-triage/dependabot.json
```

`gh api --paginate` emits one concatenated array per page — **always** merge:

```
jq -s 'add' .security-triage/dependabot.json > .tmp && mv .tmp .security-triage/dependabot.json
```

Then **validate** the result is real data, not an error object. A 404/403 body is
`{message,documentation_url,status}`, and `jq 'length'` on it returns `3` — which looks like
"3 alerts". Guard explicitly:

```
jq -e 'type=="array"' .security-triage/dependabot.json >/dev/null \
  || echo "Not an array — Dependabot fetch failed (likely token scope). Stopping."
```

If it is not an array, the fetch failed — almost always token scope. **Don't pre-gate on a scope
check:** `repo` scope alone returned the full backlog in practice, so just try the fetch first.
Only if it 403/404s or returns a non-array does the token likely need `security_events` — add it
with `gh auth refresh -s security_events` (web-OAuth `gho_` login) or mint a new classic token with
`repo` + `security_events` and `gh auth login --with-token` (PAT, since refresh can't add scopes to
a PAT) — then retry. Stop until the fetch returns an array.

## Step 2 — Dedupe, then validate usage

A large backlog (100s of alerts) collapses to a small set of distinct vulnerabilities — the same
CVE is reported once per manifest that declares the package, and a monorepo with a single hoisted
lockfile installs one copy. **Triage the distinct set, not the raw alerts.** Dedupe first:

```
# distinct (package, advisory) — the real triage unit
jq -r 'group_by(.security_advisory.ghsa_id + "|" + .dependency.package.name)
  | map({pkg:.[0].dependency.package.name, sev:.[0].security_advisory.severity,
         ghsa:.[0].security_advisory.ghsa_id, n:length}) | .[]
  | "\(.sev)\t\(.pkg)\t\(.ghsa)\tx\(.n)"' .security-triage/dependabot.json | sort
```

By default focus on **critical + high** (ask the user if they want medium/low too — a big backlog
is rarely worth triaging end-to-end). Then **group by package** for the rest of the workflow: one
bump usually clears every alert for a package across all manifests.

**Read the full vulnerable-range set per advisory, not just the first.** Each advisory's
`security_advisory.vulnerabilities[]` has one entry **per affected major line** (e.g. `form-data`
patches `<2.5.6` *and* `>=4.0.0,<4.0.6`; `undici` patches separate 6.x / 7.x / 8.x lines; a `<6.27`
range has no lower bound and also covers 5.x). A table built from `vulnerabilities[0]` silently
understates exposure — pull them all:

```
jq -r '.[] | select(.security_advisory.ghsa_id=="<GHSA>")
  | .security_advisory.vulnerabilities[]
  | "  range=\(.vulnerable_version_range)  patched=\(.first_patched_version.identifier // "none")"' \
  .security-triage/dependabot.json | sort -u
```

**Census the lockfile in the main thread — do not trust subagent recall.** Before spawning
subagents, list every installed copy of each package straight from the lockfile. This is
authoritative; subagents routinely under-count duplicate transitive copies (in practice two
subagents reported a single copy where the lockfile held three):

```
grep -oE '"<pkg>@[0-9][^"]*"' bun.lock | sort -u   # every installed version, incl. transitive dupes
```

Spawn one subagent **per package (or per distinct advisory)** — never one per raw alert. Each
confirms the alert is real for THIS repo:

- Confirm the package is actually a dependency (direct or transitive) and which manifest(s)
  declare it. **Ignore `node_modules/**` paths** when grepping manifests.
- Confirm the **specific vulnerable API / code path** is actually imported and exercised — not a
  transitive-only or dead-code path.
- **Ground "is it vulnerable" in the lockfile, not recall.** Read the installed version from the
  lockfile and compare to the advisory's vulnerable range. A version inside the range is
  vulnerable even if it looks recent. For packages with **multiple advisories**, being ≥ one
  advisory's first-patched version does NOT mean safe — another advisory may patch higher (e.g.
  `form-data` 4.0.4 clears `<4.0.4` but is still vulnerable to the `<4.0.6` advisory). LLM guesses
  about installed versions are unreliable; always check the lockfile.
- Note the **first patched version** and whether a fixed version exists at all.
- Assess real exposure (reachable with attacker input vs dev/build-time only).

Detect the package manager from the repo (`packageManager` field + which lockfile exists:
`bun.lock` → bun, `package-lock.json` → npm, `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn). This
repo is **bun**. Use the matching tooling in Step 4.

Emit a verdict per package/advisory: `AFFECTED` (vulnerable path used) / `NOT_AFFECTED` (dep
present but vulnerable API unused) / `NO_FIX_YET` (no patched version anywhere) / `DEV_ONLY`
(build/test-time only).

## Step 3 — Report

Write a review-ready markdown file **per affected package** under
`.security-triage/reports/dependabot-<package>.md` (not one per alert — that does not scale).
Each lists: the package's advisories + vulnerable ranges, installed version(s) from the lockfile,
first patched version(s), usage verdict + the call sites, severity, the constituent alert IDs,
and a recommendation.

Then write the consolidated **`.security-triage/DEPENDABOT-TRIAGE-SUMMARY.md`** (the review
artifact — a distinct name from the advisories skill's `TRIAGE-SUMMARY.md`, which shares this
workspace; do not clobber it):
verdict tally (AFFECTED / NOT_AFFECTED / NO_FIX_YET / DEV_ONLY), a table grouped by severity +
verdict (package, severity, installed → fix, verdict, reachability, alert count), and any
**shared-dependency patterns** (one bump resolves several alerts, or several alerts share a
manifest).

Present the headline verdicts in chat, **most attacker-reachable first**. Surface `DEV_ONLY`
findings in a separate group — a critical CVSS in a dev-only test runner should not bury an
attacker-reachable high in production code.

## Step 4 — Fix on approval (bump must be PROVEN non-breaking)

After the user picks which packages to fix:

**Single lockfile → one batched PR.** In a monorepo with one shared lockfile (bun/npm/pnpm),
per-package branches all conflict on the lockfile. Bump **all** approved packages in **one**
isolated worktree and open **one** PR — never a worktree/PR per package.

1. Create one isolated git worktree for the whole batch so the main tree is untouched.
2. Bump each dependency to the first patched version that clears **all** of its advisories
   (bun: edit the pinned range + `bun install`). Direct deps here are usually **exact-pinned**, so
   bump them in every manifest that declares them — a `find … -not -path '*/node_modules/*' -exec
   sed -i 's/"<pkg>": "<old>"/"<pkg>": "<new>"/'` sweep is appropriate for an exact pin.
3. **Dedupe the leftover copies carefully — this is where bumps go wrong.** Re-run the Step 2
   census after the bump. For each still-vulnerable copy:
   - **Same major line, our own tree** → pin it with a flat `resolutions`/`overrides` entry
     (e.g. `"axios": "1.16.0"`). **bun honours only FLAT keys — scoped keys like
     `"superagent/form-data": "x"` are silently ignored**, so a flat pin forces *every* copy.
   - **Crossing a major line inside a third-party SDK** (e.g. `form-data` 2.x in `superagent`,
     `undici` 5.x in a vendor client) → **do NOT force it.** The repo's tests don't exercise that
     SDK's code path, so a forced cross-major bump **cannot be proven non-breaking**. Leave it and
     **document it as a residual** in the package report + PR body (which copy, which advisory, why
     not forced). Fixing the attacker-reachable *direct* deps is the bar; transitive SDK-internal
     copies wait for the SDK to update.
   Confirm the final tree with the census grep.
4. Classify the semver jump. **A minor/patch bump is NOT automatically safe** — libraries tighten
   TypeScript types in minor releases and break the build (in practice `samlify` 2.10→2.13, a
   minor, broke `tsc` by narrowing a parameter type). Flag majors as highest-risk, but never skip
   the build on a "low-risk" bump.
5. Read the dependency's changelog / release notes between current and target for breaking changes.
6. Grep every usage of the dependency's API across the repo and check each call against the new
   version. Any required code change (e.g. adapting to a tightened type) goes in the **same** PR.
7. Run typecheck + **build** + lint + the affected packages' tests:
   `npx turbo run build lint test --filter=<pkg> …` (one `--filter` per affected package).
8. **Triage failures — don't assume the bump caused them.** If a test fails, re-run it on the base
   (HEAD) tree before blaming the bump: stale tests and network-dependent integration tests fail
   regardless of the dependency version. Only a test that is green on base and red after the bump
   is yours to fix.
9. A dep bump inside a **versioned internal package** (`packages/core/shared`,
   `packages/server/utils`) trips the repo's version-bump rule — patch-bump those packages too
   (once per branch, not per edit).
10. Propose the PR **only if build/lint/tests pass** (or the only failures are proven
    pre-existing/environmental, per step 8). Otherwise report the exact breakage and options (pin,
    patch-only bump, or required code change). Discard the worktree on failure.

**NO_FIX_YET packages get no bump PR.** Instead produce a risk-acceptance / mitigation writeup in
the package report: where it's reachable, any existing sandboxing, and the options (accept
residual risk with justification, patch locally via `patch-package`/bun patch, or swap the
library). If the only available fix is an external source (e.g. SheetJS off npm → CDN tarball),
flag the **self-hosting rule** — an install that depends on a third-party CDN at build time may
break zero-setup self-hosting; call it out for a maintainer decision.

Dependency CVEs are public, so a normal PR is fine (no private-fork flow). Patch-bump scope — do
not bundle unrelated upgrades.

## Output recap

Everything lands in `.security-triage/` (gitignored): `dependabot.json`, `DEPENDABOT-TRIAGE-SUMMARY.md`, and
one report per affected package under `reports/`.
