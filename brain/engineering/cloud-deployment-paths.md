---
icon: 🚀
---

# Cloud Deployment Paths

How code reaches `cloud.activepieces.com`. Two workflows in `.github/workflows/`: `continuous-delivery-canary.yml` and `continuous-delivery-cloud.yml`. Both cloud paths run the same job graph — `guard` → `build-image` → `deploy-canary` → `promote-to-production` — and both reach prod only after canary deploys cleanly.

## The normal path
Cloud's `workflow_call`/scheduled run skips `build-image`, so `deploy-canary` gets an empty `image_tag` and the canary workflow builds its own `.canary` image and runs `check-migrations`. Prod then deploys the `release-candidate` tag, not that image.

## The override path
`Continuous Delivery — Cloud` → **Run workflow** → `cloud-hotfix` builds one `.beta` image from the current branch and hands its tag to the canary workflow via `image_tag`, so canary deploys the exact artifact prod is about to get instead of rebuilding it. It also passes `skip_migration_check: true`. A `guard` job refuses the hotfix if the scheduled promotion is under an hour away, and a rejected guard skips canary too.

## Gotchas
- **`check-migrations` gates canary *and* the cloud promotion that calls it.** The canary workflow fails when any pending migration carries `breaking = true` (rollback safety — see `tools/scripts/check-manifest-migrations.ts`), and the scheduled cloud run inherits that gate. `cloud-hotfix` passes `skip_migration_check: true` to bypass it: a deliberate cloud release ships the breaking migration to prod anyway, so blocking canary on it only leaves canary behind prod. There is still no canary-only override — dispatch the cloud workflow.
- **Skipping a `needs` job reads the same as a rejected one.** `build-image` is skipped both when the run is scheduled *and* when `guard` fails a hotfix, so `needs.build-image.result == 'skipped'` alone would deploy canary for a hotfix the guard just refused. `deploy-canary` therefore also needs `guard` and checks `needs.guard.result != 'failure'`.
- **`docker pull … error from registry: denied` on the ops host can be transient.** Seen 2026-08-12 pulling a `.beta` tag to the canary host; re-running the same job with no other change pulled and deployed fine. The tag existed in GHCR the whole time. Re-run once before suspecting the host's registry credential — GHCR does answer `GET /v2/` for a token that cannot pull, so login-succeeds/pull-denied is *consistent* with an expired credential, but it is not evidence of one.
- **`breaking = true` on a migration and the `⛓️‍💥 breaking-change` PR label are different axes.** The migration flag is about rollback safety and is what stops deploys; the label is about self-hoster upgrade impact and is enforced by `breaking-change-check.yml` on PRs. Neither implies the other.
