---
status: accepted
---

# Piece tarballs are never mirrored into our own S3

## Decision
`pieceBundle.resolve()` hands out exactly two kinds of link for a registry piece: the CDN's self-contained bundle when it serves one, otherwise the npm tarball. It does not consult, populate, or fall back to an Activepieces-owned S3 copy, and there is no lazy caching job behind it — the `BUNDLE_PIECE` system job was deleted rather than fixed. `ARCHIVE` (custom) pieces are unaffected; they are platform-scoped rows in our own file store and are still streamed from it.

## Context
Until Aug 2026 `resolve()` checked an S3 mirror first (`pieces/v2/`), and on a miss enqueued `BUNDLE_PIECE` to populate it for next time. That job wrote **whichever source was preferred at cache time** — the CDN artifact when `AP_USE_CDN_FOR_BUNDLES` was on, the npm tarball otherwise.

Because the read order put S3 ahead of the CDN, a bucket populated while the flag was off kept serving the *unbundled npm build* for that piece forever, and turning the flag on later changed nothing for any piece already mirrored. The job carried a comment warning about precisely this, which is the tell that the ordering was known to be load-bearing and fragile.

The cost is not theoretical. An unbundled tarball declares its build-time dependencies, so each piece pulls its own `@activepieces/shared` and `pieces-framework`. Measured on a 0.88.1 dedicated cloud host: **7 resident `@activepieces/shared` copies holding 208 MB of a 642 MB engine heap** (~33 MB each, ~3,400–4,000 Zod schema objects per copy retained through `require.cache`), 12 distinct versions on disk, and only **7 of 45** installed piece folders carrying a CDN bundle.

## Why
A cache that can outrank its own upstream is a cache that pins a bug. The mirror's precedence made the *first* fetch permanent, so any later improvement to how pieces are built could not reach a piece that had already been cached — and the repair for a poisoned entry is a bucket operation, not a deploy. Deleting the mirror makes the CDN the single upstream, so what a worker installs is decided by the current release rather than by whenever that piece was first requested.

The obvious alternative was to keep the mirror and only cache CDN artifacts, never npm. Rejected: it keeps a second source of truth whose contents still depend on flag state at write time, still needs a prefix bump every time the meaning of a cached object changes (`pieces/` → `pieces/v2/` was already the second generation), and buys little — the CDN is itself a CDN, so we were caching a cache. The mirror's real benefit was egress and independence from npm, and that was never actually delivered, because a cold entry always fetched from npm anyway.

Not in scope, deliberately: `AP_USE_CDN_FOR_BUNDLES` still defaults to `false`. This decision removes what would *shadow* the CDN once that default flips; flipping it is a separate call.

## Consequences
Both S3 prefixes (`pieces/`, `pieces/v2/`) become dead storage and can be swept — and note `pieces/v2/` is nested inside `pieces/`, so a recursive delete hits both (see *File Storage*). Every piece install now depends on the CDN or npm being reachable, with no local buffer; a self-hoster with S3 configured no longer accumulates a private copy. During a rolling deploy, old instances keep enqueuing `bundle-piece` while new ones have no handler, so those jobs fail with `No handler for job bundle-piece` until the rollout finishes — they are cache-warming only, so nothing user-facing breaks. Reintroducing a mirror later means re-deciding the read order, and the rule to keep is that a mirror must never be consulted ahead of the source it was copied from.
