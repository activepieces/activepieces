---
status: accepted
---

# Helm chart keys are generated in-cluster, and user secrets override them

## Decision

The chart gets `AP_ENCRYPTION_KEY` and `AP_JWT_SECRET` from the mittwald `secret-generator` subchart, which fills `<fullname>-secrets` and `<fullname>-jwt-secret` in-cluster. The pod reads them through `envFrom`. A user-created `activepieces-auth-secrets` is mapped through `env`, so it wins at runtime.

## Context

GIT-1923: after worker v2 the generated secrets were never wired in, so a default install crashlooped. Users who worked around it had already created `activepieces-auth-secrets` with their own keys, and their stored data is encrypted with those keys.

## Why

`lookup` + `randAlphaNum` regenerates the key on every `helm template` / ArgoCD render, which would silently rotate the encryption key. Rendering one env name twice to get precedence gets rejected by Helm 4's server-side apply. `env` over `envFrom` gives the runtime fallback without either problem, and upgrades change nothing for existing users.

## Consequences

Renaming the generated keys or secrets orphans every install's key. The chart keeps a cluster-scoped operator as a dependency.
