---
name: cut-a-release-branch
description: Cut a release/vX.Y.Z branch, bump the version, and deploy it to cloud production.
---

# Cut a release branch

1. `git checkout -b release/vX.Y.Z origin/main` — always branch off a freshly fetched `origin/main`.
2. Bump the version in exactly two files:
   - `package.json` → `"version": "X.Y.Z"`
   - `docker-compose.yml` → both `ghcr.io/activepieces/activepieces:X.Y.Z` tags (app + worker)

   Other `X.Y.Z` hits in the repo (`minimumSupportedRelease` in a piece, a migration's `release` field) are historical anchors — leave them.
3. Commit as `chore(release): vX.Y.Z` and push to `origin`. No PR — a release branch is not a change to review.
4. Deploy to cloud production:
   `gh workflow run continuous-delivery-cloud.yml --ref release/vX.Y.Z -f action=cloud-hotfix`

## Gotchas

- `package.json` is the single runtime source of truth for the version — `apVersionUtil.getCurrentRelease()` reads it, and the cloud workflow derives the image tag `${version}.${sha}.beta` from it. Bump it before dispatching, or the deployed image is tagged with the old release.
- `cloud-hotfix` builds from the branch and goes **straight to production**, skipping canary. The scheduled Sunday-09:00-UTC promotion path is the one that runs canary first.
- The workflow's `guard` job refuses to run within an hour of the scheduled promotion — wait for the scheduled run instead of forcing a hotfix.
- Self-hosted publishing is a **separate** workflow (`release-self-hosted.yml`, dispatched with a `tag` input). Cutting the branch and deploying cloud does not ship the self-hosted image.
