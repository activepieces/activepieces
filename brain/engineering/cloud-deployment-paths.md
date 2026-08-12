---
icon: 🚀
---

# Cloud Deployment Paths

How code reaches `cloud.activepieces.com`. Two workflows in `.github/workflows/`: `continuous-delivery-canary.yml` and `continuous-delivery-cloud.yml`.

## The normal path
Cloud's `workflow_call`/scheduled run calls the canary workflow as a job, then promotes the `release-candidate` tag to prod. Canary builds its own `.canary` image; prod deploys the `release-candidate` tag, not that image.

## The override path
`Continuous Delivery — Cloud` → **Run workflow** → `cloud-hotfix` builds a `.beta` image from the current branch and deploys it to canary **and** prod, in that order, from the `promote-to-production` job. It never invokes the canary workflow. A `guard` job refuses the hotfix if the scheduled promotion is under an hour away.

## Gotchas
- **`check-migrations` gates canary *and* the scheduled cloud promotion.** The canary workflow fails when any pending migration carries `breaking = true` (rollback safety — see `tools/scripts/check-manifest-migrations.ts`). Because the scheduled cloud run calls that workflow, one breaking migration blocks both. The escape hatch is `cloud-hotfix`: it deploys canary and prod without touching the canary workflow, so it bypasses the gate by construction — there is no skip flag, and there is no canary-only override.
- **Never put a BuildKit cache mount on `/var/cache/apt` or `/var/lib/apt`.** The `node:*-bullseye-slim` base ships `/etc/apt/apt.conf.d/docker-clean`, which wipes downloaded `.deb`s and sets `Keep-Downloaded-Packages "false"` — so the mount caches nothing, but it does persist stale `apt` lists and `partial/` leftovers across Depot builds. When `bullseye-security` republishes and old `.deb`s rotate out, the next build dies on `Hash Sum mismatch` / `Unable to fetch some archives` → `exit code: 100`, which reads like a missing package but isn't. Removed from both Dockerfiles on 2026-08-12; a plain `apt-get update && apt-get install` is what works. Also: bullseye `main` has been frozen since Aug 2025 and Debian 11 LTS ends Aug 2026, so the base image needs a bookworm bump.
- **`breaking = true` on a migration and the `⛓️‍💥 breaking-change` PR label are different axes.** The migration flag is about rollback safety and is what stops deploys; the label is about self-hoster upgrade impact and is enforced by `breaking-change-check.yml` on PRs. Neither implies the other.
