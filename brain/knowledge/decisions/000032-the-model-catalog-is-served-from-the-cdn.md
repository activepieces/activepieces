---
icon: 📇
status: accepted
---

# The model catalog is served from the CDN

## Decision

Per-model metadata is published to `https://cdn.activepieces.com/ai/model-catalog.json` by a weekly
workflow and fetched at runtime by `modelCatalog.lookup()`. Nothing is committed to the repo and no
process imports it. The source is [models.dev](https://models.dev) and only models.dev.

## Context

The model picker needed cost, context window, release date and capability flags, none of which existed
in the tree. The first implementation vendored a generated JSON into `@activepieces/server-utils` and
imported it. Review pushed back on shipping a 213 KB file that every process parses at boot.

## Why

The measured cost of the vendored file was small — **0.7 ms to parse, ~452 KB heap** — but the
objection had a real defect behind it: `packages/server/worker` depends on `server-utils`, so the
worker paid that cost while never calling the catalog at all.

The CDN buys two things the file could not. The catalog **refreshes without a redeploy**, so a new
model or a price cut reaches every install within the hour instead of at the next release. And with
nothing to commit, the weekly job no longer pushes a branch or opens a PR — which removed the
`GITHUB_TOKEN`-cannot-create-PRs problem entirely (see the CI PR Review Hygiene page).

The rejected alternative was keeping the file in the image as an offline fallback, read lazily only
when the fetch fails. That would have answered the parse-cost objection just as well and kept
air-gapped installs working, at about ten extra lines. It was turned down in favour of the simpler
single-source design.

## Consequences

**An install with no egress to `cdn.activepieces.com` gets no model metadata, ever** — air-gapped
deployments, networks with an outbound allowlist, or a CDN outage. It degrades to the plain
`{ id, name }` row rather than breaking, because every metadata field is optional, but there is no
message explaining the absence. `AP_MODEL_CATALOG_URL` is the escape hatch: point it at a self-hosted
mirror. This is a knowing exception to `.claude/rules/self-hosting.md`, not an oversight.

**Pricing data reaches production weekly with nobody reviewing the diff.** The generator's truncation
guard — refuse to publish if a provider block disappears or the model count falls more than 20% against
the currently published copy — is the only thing between a partial models.dev payload and every
install. It compares **per provider**, not just in aggregate: a collapse inside one provider is
otherwise hidden by growth in another — a previous catalog with openai at 200 against a regenerate at
47 passes an aggregate check (794 of a required 554) while openai loses three quarters of its models.
A loss of at most two models is tolerated regardless of ratio, so a three-model provider like deepseek
does not trip the guard on one legitimate removal. Because it is the only check, it **fails closed**: only a `404` (nothing published yet) is
allowed to skip it and bootstrap the first upload. A network error, a 5xx, or a non-JSON body all abort
the run, because "cannot read the current catalog" is not the same as "there is no current catalog" —
treating them alike lets a transient CDN blip disable the guard at exactly the moment it matters.
That rule has two layers and both were needed: rejecting a body that is not JSON is not enough, because
valid JSON of the wrong shape (`{"foo": 1}`) leaves `providers` undefined and reads as "no prior
catalog" all the same. The document is validated structurally before it is trusted. `{"providers": {}}`
is deliberately allowed through — an empty catalog is a recoverable state, not an unknown one, and
blocking it would strand the next publish after a bad one. The
published object carries `generatedAt` so staleness is diagnosable with a `curl`.

**The object must exist before the code ships.** Until the first `workflow_dispatch` run lands it,
every install silently shows no metadata, including local dev.
