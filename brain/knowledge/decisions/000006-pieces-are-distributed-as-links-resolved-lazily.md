---
status: accepted
---

# Pieces are distributed as links, resolved lazily

## Decision
Every piece is fetched as a single downloadable link to its `.tgz`, served by an engine-token, platform-scoped endpoint (`GET /v1/engine/pieces/bundle?name=&version=`) that 307-redirects to whatever source exists: a signed S3 object, the npm tarball for an official piece, or the app's file store for a custom (ARCHIVE) piece served directly. The box downloads the link and `bun install`s it, one path for all piece types, no piece bytes crossing the worker socket. S3 copies are warmed lazily: a miss returns the npm/file link immediately and fire-and-forgets a deduped SYSTEM job to cache the tarball.

## Context
The old path branched registry-vs-archive and pushed custom-piece bytes over the worker Socket.IO connection (`getPieceArchive`, `ProvisionInput.fetchArchive`), coupling the execution box to the app connection. Making the box transport-uniform (ADR 0001's pure pool) required deleting that branch.

## Why
"Everything is a link" makes the box transport-uniform over plain HTTP, deleting the socket byte path and the branch. Lazy beats eager:

- The warming job is deduped by `jobId = bundle:<platformId|global>:<name>:<version>`, so an on-demand per-piece job is safe and avoids a proactive "sync every bundle to S3" batch or a cold-start scan.
- Backing the link by npm or the file store makes S3 a pure optimization, so self-hosters with no S3 still get a working link.
- Rejected PR #13865's form: eager batch sync + global `name@version` S3 keys (cold-start cost, missing tenant scoping, weaker auth).

## Consequences
Platform scoping is mandatory (data-isolation rule): the endpoint resolves via `pieceMetadataService.get({ name, version, platformId })` and custom-piece S3 keys are platform-namespaced, closing the cross-tenant `name@version` collision from the original global-keyed PR (#13865).

- `getPieceArchive` / `fetchArchive` are removed.
- The link is the piece's own tarball, so `bun install` still needs npm egress for transitive deps.
