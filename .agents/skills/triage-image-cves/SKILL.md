---
name: triage-image-cves
description: Scan an Activepieces Docker image with grype for OS/base-image (deb) and application (npm) CVEs of High/Critical severity. Lists the 3 most-recent published tags and lets the user pick which to scan, validates each finding is real and reachable, and proves candidate fixes in an isolated git worktree (rebuild image + re-scan + tests + container smoke-run + codebase diff) before proposing anything — fixes are NEVER auto-applied; the user decides per finding. Use when the user asks to grype-scan the image, triage container/image vulnerabilities, or check a shipped Docker image for CVEs.
---

# Triage Image CVEs (grype container scan)

On-demand triage of vulnerabilities in a **published Activepieces Docker image** on Docker Hub
(`activepieces/activepieces`) using [grype](https://github.com/anchore/grype). The skill lists the
**3 most-recent tags** and lets the user pick which to scan. Produces a **review-ready** report
per affected package and proposes fixes that are **proven non-breaking in an isolated worktree** —
image rebuilds, the target CVE clears with no new High/Critical introduced, tests pass, the
container boots, and the codebase diff is scoped. **Nothing is ever applied to the working tree or
committed.** The user decides per finding: approve / dismiss / escalate.

Scope (decided with the user; defaults below — re-confirm if they want different):
- **Image source:** Docker Hub `activepieces/activepieces`, one of the **3 most-recent tags**,
  chosen by the user at the start of the run.
- **Findings:** both OS/base-image packages (`deb`, fix = Dockerfile base/apt change) **and** app
  npm deps (fix = lockfile bump).
- **Severity:** **High + Critical only** (above medium).
- **Validation:** full gate, always in a throwaway git worktree.

Artifacts go in the `.security-triage/` workspace (gitignored).

## Privacy note

Write all artifacts to `.security-triage/` (gitignored — confirm with `git status` after a run
that nothing new appears under tracked paths). Image CVEs are public, so fixes may use normal PRs
(no private-fork flow) — but still never commit triage artifacts.

## Prerequisites

- `grype` on PATH (`grype version`). If missing, install it yourself first — **do not pipe a
  remote installer into a shell**. Prefer a package manager (`brew install grype`) or download the
  pinned release binary from https://github.com/anchore/grype/releases and verify its published
  checksum before use. If grype is absent, this skill stops and asks you to install it rather than
  fetch-and-exec an installer in the security workspace.
- `docker` running.
- First scan downloads/updates the grype vuln DB (needs network). Force it once with
  `grype db update` if a run reports a stale DB.

## Step 1 — Pick the tag, then scan (deterministic)

List the **3 most-recent tags** from Docker Hub and let the user choose which to scan (use
`AskUserQuestion`, one option per tag, newest first, showing the push date):

```
mkdir -p .security-triage
curl -s "https://hub.docker.com/v2/repositories/activepieces/activepieces/tags?page_size=50&ordering=last_updated" \
  | jq -r '[.results[] | select(.name|test("^[0-9]+\\.[0-9]+\\.[0-9]+$"))][0:3][]
           | "\(.name)\t\(.last_updated)"'
```

The `select(... test ...)` keeps only semver release tags and drops the floating `latest` pointer
(it just aliases one of them). If the API call fails or returns nothing, fall back to
`docker search` / ask the user for a tag explicitly. Set `TAG` to the user's choice, then scan:

```
docker pull activepieces/activepieces:$TAG
# scan EVERYTHING (do not pass --only-fixed here — we still want to surface no-fix CVEs for a
# risk writeup). Pin the platform so the result is reproducible.
grype activepieces/activepieces:$TAG --platform linux/amd64 -o json \
  > .security-triage/grype.json
```

**Validate it is a real scan, not an error.** A failed scan can still write a small JSON object;
guard on the `matches` array explicitly:

```
jq -e '.matches | type=="array"' .security-triage/grype.json >/dev/null \
  || echo "No matches array — grype scan failed (pull/DB/network). Stopping."
```

Filter to **High + Critical**, dedupe to the real triage unit `(CVE, package, version)` — the same
CVE recurs once per install location — and split OS vs app by `artifact.type`:

```
# the deduped High/Critical set, tagged class=os|app
jq -r '
  .matches[]
  | select(.vulnerability.severity=="High" or .vulnerability.severity=="Critical")
  | { id:.vulnerability.id, sev:.vulnerability.severity,
      pkg:.artifact.name, ver:.artifact.version, type:.artifact.type,
      fixState:.vulnerability.fix.state,
      fixedIn:((.vulnerability.fix.versions // []) | join(",")),
      class:(if (.artifact.type|test("^(deb|apk|rpm)$")) then "os" else "app" end) }
' .security-triage/grype.json \
  | jq -s 'unique_by(.id + "|" + .pkg + "|" + .ver)' \
  > .security-triage/grype-filtered.json

# headline table, OS first then app, critical first
jq -r 'sort_by(.class!="os", (.sev=="Critical"|not), .pkg)[]
  | "\(.class)\t\(.sev)\t\(.pkg) \(.ver)\t\(.id)\tfix=\(.fixState):\(.fixedIn)"' \
  .security-triage/grype-filtered.json
```

`fixState` is `fixed` / `not-fixed` / `wont-fix` / `unknown`. Only `fixed` findings have a fix to
test; the rest go to the risk-writeup path (Step 4, NO_FIX_YET).

**Reachability caveat for OS findings:** the shipped image's `run` stage is `FROM base`, so the
build toolchain in the Dockerfile (`g++`, `build-essential`, `git`, `python3`, `poppler-utils`,
`curl`, …) is **present in the final image**, not stripped. "Present" therefore does not mean
"reachable" — a CVE in `g++` only matters if a runtime path invokes it. Decide reachability in
Step 2, do not assume.

## Step 2 — Validate each finding (one focused subagent per package)

Spawn one read-only subagent **per package** (not per match). Each returns a verdict backed by
evidence. Keep subagents read-only; they write `reports/image-<pkg>.md` and return a compact
verdict line.

For **every** finding, ground the version in the scan, not recall: the installed version is
`artifact.version` from `grype.json`; compare it to the advisory's fixed version
(`vulnerability.fix.versions`). Pull the advisory link from `vulnerability.dataSource`.

**OS / base-image (`deb`) findings:**
- Confirm the package is in the **shipped** image (it is, if grype found it on the scanned tag) and
  whether it sits on a **runtime-reachable** path or is a build-tool leftover. Map it to how AP
  uses it: `git` → git-sync; `python3`/`poppler-utils` → PDF/AI pieces; `ca-certificates`/`curl`
  → outbound HTTP; `g++`/`build-essential`/`node-gyp` → native-module rebuild at install (build-
  time, but the binary still ships). State which.
- Determine the fix path and its blast radius:
  - **apt patch available in bullseye** → `apt-get install -y --only-upgrade <pkg>` or pin the
    fixed version. Low risk.
  - **fixed only in a newer base tag** → bump `FROM node:<x>-bullseye-slim` to the latest patch
    digest. Medium risk (Node minor/patch).
  - **fixed only in a newer Debian release** → bullseye(11)→bookworm(12). **High risk** —
    glibc/openssl bumps can break native modules (`isolated-vm`, sandboxes). Must be proven by the
    full gate, never proposed on paper.
  - **no fix** → `not-fixed`/`wont-fix` → NO_FIX_YET.
- **Self-hosting rule:** any base/apt change must keep zero-setup self-hosting working — no new
  env var, no build-time dependency on a third-party CDN, no manual step. Flag violations.

**App (`npm`) findings:**
- Confirm the package is a real dependency and the **vulnerable API is actually exercised** (not
  transitive dead code). Read the installed version from `bun.lock` (this repo is **bun**), not
  from recall. For a package with multiple advisories, being ≥ one fix version does not mean safe.
- **Confirm it on the built image, not just the lockfile.** The shipped image runs a trimmed
  `bun install --production` over a regenerated lockfile (pieces are stripped in the build), so the
  set of installed npm packages in the image can differ from the dev `bun.lock`. The version grype
  reports is the one actually shipped — treat that as ground truth.

Emit one verdict per package:

| Verdict | Meaning |
| --- | --- |
| `FIXABLE` | Reachable, a patched version exists, fix path is in-distro / minor bump. |
| `FIX_VIA_BASE_BUMP` | Only fixed by a base-image tag/release bump (higher risk; must pass full gate). |
| `NOT_REACHABLE` | Package present in image but the vulnerable component is not invoked by AP. |
| `NO_FIX_YET` | No upstream fix (`not-fixed` / `wont-fix`). Risk writeup, no build. |

## Step 3 — Report

Write `.security-triage/reports/image-<pkg>.md` per affected package: class (os/app), the CVEs +
severities, installed version (from the scan), fixed version(s), `fixState`, reachability verdict
with the runtime path, the proposed fix path + risk class, and any self-hosting concern.

Then the consolidated **`.security-triage/IMAGE-CVE-TRIAGE-SUMMARY.md`** (distinct filename so it
never collides with other tools' artifacts in the shared gitignored `.security-triage/` workspace):
- Image digest scanned + grype DB date (`jq '.descriptor' grype.json`), so the run is reproducible.
- Verdict tally and a table grouped by class then severity (pkg, severity, installed → fix,
  verdict, reachability, CVE count).
- Findings clearable by a **single base-image bump** grouped together (one Dockerfile change
  resolves many deb CVEs).

Present headline verdicts in chat, **runtime-reachable first**; surface `NOT_REACHABLE` /
build-only separately so a scary-looking CVE in a build tool doesn't bury a reachable one. Then
**ask the user which findings to fix** before doing anything.

## Step 4 — Fix on approval (PROVEN in an isolated worktree, never applied)

Only after the user picks findings. **All build/test/scan work happens in a throwaway git
worktree so the working tree is never touched.**

```
# <short> MUST be unique per run (e.g. $(date +%s)-$RANDOM) so paths never collide across runs;
# `git worktree add` also aborts if the path already exists, so a collision fails here.
git worktree add ../ap-cve-fix-<short> HEAD     # isolated copy; main tree stays clean
```

Group approved fixes sensibly: **all approved OS findings → one Dockerfile change set**; **all
approved npm bumps → one lockfile change set** (the repo has a single shared `bun.lock`, so per-
package branches would all conflict on it — bump all approved npm packages in one batch, never one
worktree/PR per package). Then, inside the worktree:

1. **Apply the candidate fix.**
   - OS: edit `Dockerfile` (and `Dockerfile.worker` if affected) — pin the upgraded apt package,
     bump the `FROM` digest, or change the Debian release. Keep it minimal and self-hosting-safe.
   - npm: bump the pinned range(s) to the first version clearing all advisories + `bun install`;
     patch-bump any versioned internal package touched (`packages/core/shared`,
     `packages/server/utils`) per the repo rule (once per branch).
2. **Rebuild the image** from the worktree: `docker build -t ap-cve-test:<short> .`
   (plus `-f Dockerfile.worker` if it was changed). A failed build = fix rejected; report the
   build error.
3. **Re-scan the rebuilt image and diff against baseline** — the fix must clear the target CVE(s)
   **and introduce no new High/Critical**:
   ```
   grype ap-cve-test:<short> --platform linux/amd64 -o json > .security-triage/grype-after.json
   # target CVE(s) gone?
   jq -r '[.matches[].vulnerability.id] | unique' .security-triage/grype-after.json   # must NOT contain the target ids
   # no NEW high/critical vs baseline?
   comm -13 \
     <(jq -r '.matches[]|select(.vulnerability.severity|test("High|Critical"))|.vulnerability.id' .security-triage/grype.json | sort -u) \
     <(jq -r '.matches[]|select(.vulnerability.severity|test("High|Critical"))|.vulnerability.id' .security-triage/grype-after.json | sort -u)
   ```
   The `comm` output must be empty (no High/Critical present after that wasn't there before).
4. **Run tests** for code/dep changes: `npx turbo run build lint test --filter=<pkg> …` (one
   `--filter` per affected package). **Triage failures against base** — re-run a failing test on
   HEAD before blaming the fix; only green-on-base / red-after is yours. For a pure base-image bump
   with no code change, the build + smoke run below is the proof; still run a representative
   package's tests to catch a glibc/native-module regression.
5. **Smoke-run the container** — prove it actually boots (entrypoint, migrations):
   ```
   docker run --rm -d --name ap-cve-smoke -p 8080:80 ap-cve-test:<short>
   # poll the health/entrypoint for boot, then:
   docker logs ap-cve-smoke; docker rm -f ap-cve-smoke
   ```
   Container must come up clean (no crash loop, migrations run). Tear it down.
6. **Scan the codebase diff** — `git -C ../ap-cve-fix-<short> status` + `git diff`. Confirm the
   change is **scoped to the intended files** (Dockerfile / lockfile / the one adapted call site)
   with no stray churn or unrelated edits. Report the diff stat.
7. **Propose only if every gate passes.** Report: build ✓/✗, target CVE cleared ✓/✗, no-new-
   High/Critical ✓/✗, tests ✓/✗, smoke-run ✓/✗, diff scope ✓/✗ — with the exact evidence. If
   anything fails, report the precise breakage and options (pin instead of bump, patch-only, base
   tag instead of release jump, or a required code change). **Do not apply, commit, merge, or open
   a PR** unless the user explicitly approves after seeing the gate results.
8. **Always discard the worktree** when done — safe because `<short>` is unique to this run, so the
   path is provably this run's: `git worktree remove ../ap-cve-fix-<short> --force`
   (and `docker rmi ap-cve-test:<short>`).

**NO_FIX_YET** findings get no build — produce a risk-acceptance writeup in the package report:
where it's reachable in the image, any sandboxing that mitigates it, and the options (accept with
justification, pin/patch locally, swap the component, or wait for upstream).

## Output recap

Everything lands in `.security-triage/` (gitignored): `grype.json` (baseline scan),
`grype-filtered.json` (High/Critical deduped), `grype-after.json` (post-fix re-scan),
`IMAGE-CVE-TRIAGE-SUMMARY.md`, and one report per affected package under `reports/image-*.md`.
The working tree and git history are never modified; all fix validation happens in a discarded
worktree.
