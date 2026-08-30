---
icon: ⛵
---

# Helm Chart

The Kubernetes install we ship to self-hosters, at `deploy/activepieces-helm/`. It is the Kubernetes peer of the `docker-compose.yml` on the Docker page — same app, different orchestrator — and it is **not** how our own Cloud deploys (see *Cloud Deployment Paths*, which runs Kamal and k3s).

## Two paths for an AP_* variable
`templates/deployment.yaml` builds one `env:` list from two values keys, in this fixed order:

- **`activepiecesConfig`** — a flat map rendered as plain `value:` entries. Rendered **first**. The shipped default holds only `AP_CONTAINER_TYPE`.
- **`activepiecesEnvVariables`** — a map of *secret name* → *list of var names*, rendered as `secretKeyRef` with `optional: true`. Rendered **second**. The shipped default routes `AP_EDITION`, `AP_EXECUTION_MODE`, `AP_ENCRYPTION_KEY`, `AP_JWT_SECRET` and the queue/auth vars through three secrets the chart does not create.

## What the chart creates
Only two secrets, both `data: {}` with mittwald `secret-generator` annotations that fill them in-cluster: `<release>-secrets` (encryption key) and `<release>-jwt-secret`. Postgres and Redis come from the Bitnami subcharts unless disabled.

## Key files
- `deploy/activepieces-helm` — chart, `values.yaml`, and `templates/`

## Gotchas
- **Setting the same `AP_*` var in both values keys puts two entries with one name in the pod spec, and the secret wins.** `activepiecesConfig` renders before `activepiecesEnvVariables`, and for duplicate env names the later entry is what the container process sees. Since the shipped `values.yaml` already lists `AP_EDITION` and `AP_EXECUTION_MODE` under `activepieces-config-secrets`, a user who follows the docs *and* has created that secret silently gets the secret's edition, not the one they set. `optional: true` saves the common case — with no such secret the ref is skipped and the plain value survives — so this reads as "works on my cluster" right up until someone populates the secret. Set each variable in exactly one place.
- **`activepieces-config-secrets`, `activepieces-auth-secrets` and `activepieces-queue-secrets` do not exist until you make them, and the script `values.yaml` names for the job is not in the repo.** The comment points at `deploy/scripts/apply-secrets.sh --secret-name <name>`; there is no `deploy/scripts/` directory. Every ref is `optional: true`, so a fresh `helm install` comes up anyway on the app's own defaults — which is why the gap survived: nothing fails, the vars are just quietly absent.
- **`AP_EDITION=ee` needs `AP_EXECUTION_MODE` set in the same breath or the pod will not boot.** `system-validator.ts` throws for `cloud`/`ee` in production unless the mode is one of `SANDBOX_PROCESS`, `SANDBOX_CODE_ONLY`, `SANDBOX_CODE_AND_PROCESS`, and the default is `UNSANDBOXED`. The error names the execution mode, not the edition, so it reads as a sandboxing problem rather than the edition switch that caused it.
