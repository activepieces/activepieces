---
icon: 🚀
---

# Cloud Deployment Paths

How code reaches `cloud.activepieces.com`. Two workflows in `.github/workflows/`: `continuous-delivery-canary.yml` and `continuous-delivery-cloud.yml`.

## The normal path
Cloud's `workflow_call`/scheduled run calls the canary workflow as a job, then promotes the `release-candidate` tag to prod. Canary builds its own `.canary` image; prod deploys the `release-candidate` tag, not that image.

## The override path
`Continuous Delivery — Cloud` → **Run workflow** → `cloud-hotfix` builds a `.beta` image from the current branch and deploys it to prod **and** canary, prod first, from the `promote-to-production` job. It never invokes the canary workflow. A `guard` job refuses the hotfix if the scheduled promotion is under an hour away.

Prod goes first deliberately: the point of a hotfix is to ship prod, so a canary-side failure must not block it. Canary was ordered first on the initial attempt and did exactly that — run 31606917583 died on canary and prod never deployed.

## Gotchas
- **`check-migrations` gates canary *and* the scheduled cloud promotion.** The canary workflow fails when any pending migration carries `breaking = true` (rollback safety — see `tools/scripts/check-manifest-migrations.ts`). Because the scheduled cloud run calls that workflow, one breaking migration blocks both. The escape hatch is `cloud-hotfix`: it deploys canary and prod without touching the canary workflow, so it bypasses the gate by construction — there is no skip flag, and there is no canary-only override.
- **`docker login` to GHCR succeeds with a credential that cannot pull.** GHCR answers `GET /v2/` for any well-formed token, so kamal's login step reports `exit status 0` and the failure only surfaces one command later as `docker pull … error from registry: denied`. Read that pair — login OK, pull denied — as "the host's `read:packages` credential expired or was rotated", not as a missing image; confirm by checking the tag exists (`gh api /orgs/activepieces/packages/container/activepieces-cloud/versions`). Hit 2026-08-12 on the canary host (46.225.110.253), which had not pulled since 2026-07-31 because the migration gate kept blocking canary deploys — the stale credential stayed invisible for twelve days.
- **`breaking = true` on a migration and the `⛓️‍💥 breaking-change` PR label are different axes.** The migration flag is about rollback safety and is what stops deploys; the label is about self-hoster upgrade impact and is enforced by `breaking-change-check.yml` on PRs. Neither implies the other.
