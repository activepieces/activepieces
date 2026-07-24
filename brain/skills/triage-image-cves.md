---
name: triage-image-cves
description: Scan a published Activepieces Docker image with grype for High/Critical OS (deb) and app (npm) CVEs, validate reachability, and prove candidate fixes in a throwaway git worktree (rebuild + re-scan + tests + smoke-run) before proposing. Fixes are never auto-applied.
---

# Triage Image CVEs (grype container scan)

On-demand triage of a published `activepieces/activepieces` Docker image. Lists the 3 most-recent tags, user picks one to scan. Produces review-ready reports + fixes **proven non-breaking in an isolated worktree**. **Nothing is ever applied to the working tree or committed** — user decides per finding. Scope defaults: High+Critical only, both OS (deb) and app (npm), full validation gate.

**Prereqs:** `grype` on PATH (install via `brew`/pinned release + checksum — never pipe a remote installer into a shell), `docker` running. Artifacts → `.security-triage/` (gitignored).

## Step 1 — Pick tag, scan
List 3 newest semver tags from Docker Hub (`.../tags?ordering=last_updated`, filter `test("^[0-9]+\\.[0-9]+\\.[0-9]+$")`, drop `latest`), user picks. Then:
```
docker pull activepieces/activepieces:$TAG
grype activepieces/activepieces:$TAG --platform linux/amd64 -o json > .security-triage/grype.json
```
Validate `.matches` is an array (else scan failed). Filter to High+Critical, dedupe to `(CVE, package, version)`, split OS vs app by `artifact.type` (deb/apk/rpm=os). `fixState` `fixed` = has a fix to test; others → NO_FIX_YET.
**Reachability caveat:** the run stage is `FROM base`, so build tools (g++, git, python3, poppler-utils, curl) DO ship — "present" ≠ "reachable"; decide in Step 2.

## Step 2 — Validate (one read-only subagent per package)
Ground versions in the scan (`artifact.version`) vs `vulnerability.fix.versions`; advisory link from `dataSource`.
- **OS/deb:** confirm runtime-reachable vs build-leftover, map to AP usage (git→git-sync, python3/poppler→PDF/AI pieces, curl/ca-certs→outbound HTTP, g++→native rebuild). Fix path + blast radius: apt patch in bullseye (low) / newer base tag (medium) / Debian release bump bullseye→bookworm (**high** — glibc/openssl can break native modules) / no fix. Any base/apt change must keep zero-setup self-hosting working.
- **App/npm:** confirm real dep + vulnerable API exercised; read installed version from `bun.lock`. **Confirm on the built image** — the image runs a trimmed `bun install --production` over a regenerated lockfile, so shipped packages differ from dev; grype's version is ground truth.
Verdicts: `FIXABLE` / `FIX_VIA_BASE_BUMP` / `NOT_REACHABLE` / `NO_FIX_YET`.

## Step 3 — Report
`reports/image-<pkg>.md` per package, then `.security-triage/IMAGE-CVE-TRIAGE-SUMMARY.md` (image digest + grype DB date for reproducibility, verdict tally, table by class/severity, findings clearable by one base bump grouped). Present runtime-reachable first; keep NOT_REACHABLE/build-only separate. **Ask which findings to fix before doing anything.**

## Step 4 — Fix on approval (PROVEN in throwaway worktree, never applied)
`git worktree add ../ap-cve-fix-<unique> HEAD`. Group: all OS → one Dockerfile change set; all npm → one lockfile change set. Inside:
1. Apply minimal fix (edit `Dockerfile`/`Dockerfile.worker`, or bump range + `bun install`; patch-bump touched versioned internal packages).
2. Rebuild `docker build -t ap-cve-test:<unique> .` (build fail = rejected).
3. Re-scan + diff: target CVEs gone AND no NEW High/Critical (`comm -13` old vs new must be empty).
4. `npx turbo run build lint test --filter=<pkg> …`; triage failures against base HEAD.
5. Smoke-run the container — must boot clean (entrypoint, migrations), then tear down.
6. `git status` + `git diff` — confirm scoped to intended files, no stray churn.
7. Propose ONLY if every gate passes (build ✓, CVE cleared ✓, no-new-H/C ✓, tests ✓, smoke ✓, diff scope ✓), with evidence. Do NOT apply/commit/PR without explicit user approval.
8. Always `git worktree remove --force` + `docker rmi` when done.

**NO_FIX_YET** → risk-acceptance writeup, no build.

Full procedure in the repo: `.agents/skills/triage-image-cves/SKILL.md`
