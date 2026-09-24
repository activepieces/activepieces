---
icon: ⛵
---

# Helm Chart

The Kubernetes install we ship to self-hosters, at `deploy/activepieces-helm/`. It is the Kubernetes peer of the `docker-compose.yml` on the Docker page — same app, different orchestrator — and it is **not** how our own Cloud deploys (see *Cloud Deployment Paths*, which runs Kamal and k3s).

## Two paths for an AP_* variable
`templates/deployment.yaml` builds one `env:` list from two values keys, in this fixed order:

- **`activepiecesConfig`** — a flat map rendered as plain `value:` entries. Rendered **first**. The shipped default holds only `AP_CONTAINER_TYPE`.
- **`activepiecesEnvVariables`** — a map of *secret name* → *list of var names*, rendered as `secretKeyRef` with `optional: true`. Rendered **second**. The shipped default routes `AP_EDITION`, `AP_EXECUTION_MODE`, `AP_ENCRYPTION_KEY`, `AP_JWT_SECRET` and the queue/auth vars through secrets the chart does not create.
- **`envFrom` the generated secrets**: lowest precedence. Supplies `AP_ENCRYPTION_KEY` / `AP_JWT_SECRET` when no user secret sets them, because `env` beats `envFrom`.

## What the chart creates
Only two secrets, both `data: {}` with mittwald `secret-generator` annotations that fill them in-cluster: `<release>-secrets` (`AP_ENCRYPTION_KEY`) and `<release>-jwt-secret` (`AP_JWT_SECRET`). Postgres and Redis come from the Bitnami subcharts (off by default, images from `bitnamilegacy/*`). With `workloadType` unset, the `activepieces.workloadType` helper picks a `StatefulSet` only on a live cluster (kind-level entries like `apps/v1/StatefulSet` in `.Capabilities.APIVersions`) that has no Argo Rollouts and no `<fullname>-preview` Service from an earlier Rollout revision; everything else, including offline renders, stays a `Rollout` as on main.

## Key files
- `deploy/activepieces-helm` — chart, `values.yaml`, and `templates/`

## Gotchas
- **Setting the same `AP_*` var in both values keys puts two entries with one name in the pod spec, and the secret wins.** `activepiecesConfig` renders before `activepiecesEnvVariables`, and for duplicate env names the later entry is what the container process sees. Since the shipped `values.yaml` already lists `AP_EDITION` and `AP_EXECUTION_MODE` under `activepieces-config-secrets`, a user who follows the docs *and* has created that secret silently gets the secret's edition, not the one they set. `optional: true` saves the common case — with no such secret the ref is skipped and the plain value survives — so this reads as "works on my cluster" right up until someone populates the secret. Set each variable in exactly one place.
- **The DB and Redis secrets do not exist until you make them.** Every ref is `optional: true`, so a missing secret is silently skipped and the app falls back to its own defaults (e.g. `localhost` Postgres), even with the subcharts enabled.
- **Offline renders can't see the cluster.** Helm's default `.Capabilities.APIVersions` has group/version entries only; a connected install adds kind-level ones such as `apps/v1/StatefulSet`. That is the only live-cluster signal that works with `--create-namespace` and restricted RBAC (a `lookup` sees no namespace yet and errors on Forbidden).
- **Never render one env name twice to get precedence.** Helm 4 installs with server-side apply, which rejects duplicate `env` keys ("duplicate entries for key"). A lower-precedence default has to come through `envFrom`.
- **Removing a duplicate env name on a Helm 3 upgrade deletes both entries.** The strategic merge patch matches `env` items by name ("hides previous definition ... may be dropped when using apply"), so a var set in both values keys vanishes from the live pod spec. Never change how an already-duplicated name renders; fix duplicates in the user's values instead.
- **`AP_FRONTEND_URL` must be reachable from inside the pod.** The worker downloads piece bundles through the public URL, so a `localhost` value boots fine and then fails every flow with `fetch failed`.
- **The mittwald subchart's ClusterRole is named after the release.** Two releases with the same name in different namespaces collide, and deleting a namespace without `helm uninstall` leaves it behind. A second release can set `kubernetes-secret-generator.enabled: false`; the first operator watches every namespace.
- **Helm 4 upgrades of a `Rollout` need `--force-conflicts`.** Argo's controller owns the Service `.spec.selector` (it adds `rollouts-pod-template-hash`), so server-side apply conflicts. After a forced upgrade Argo re-adds the hash and traffic keeps routing.
- **The HPA targets whatever `activepieces.workloadType` resolves to.** It used to target a `Deployment` the chart never creates.
- **`Chart.yaml` `appVersion` is the default image tag.** `release-self-hosted.yml` fails the release if it drifts from `package.json`, and the version sync PR bumps it.
- **`AP_EDITION=ee` needs `AP_EXECUTION_MODE` set in the same breath or the pod will not boot.** `system-validator.ts` throws for `cloud`/`ee` in production unless the mode is one of `SANDBOX_PROCESS`, `SANDBOX_CODE_ONLY`, `SANDBOX_CODE_AND_PROCESS`, and the default is `UNSANDBOXED`. The error names the execution mode, not the edition, so it reads as a sandboxing problem rather than the edition switch that caused it.
