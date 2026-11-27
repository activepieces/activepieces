---
id: ap-pre-warm-cache-removed
title: "`AP_PRE_WARM_CACHE` removed"
added: '2026-06-18'
order: 4
release: 0.86.0
---

The `AP_PRE_WARM_CACHE` environment variable no longer exists. It used to make a worker install pieces into its cache on startup. The worker is now its own sandbox and fills its cache lazily on first use, so the flag has no effect and setting it does nothing. Cache warmth now comes from running long-lived worker replicas rather than an up-front install step.

The up-front install is no longer needed because piece installs are now fast: each piece is a self-contained bundle fetched as a single file. If you have S3 enabled, official piece bundles are cached to your S3 bucket on first use and served from there via signed links — so when your bucket is co-located in the same region as your workers, subsequent installs are a low-latency download from a nearby object store instead of a registry round-trip.

<Note>
Removed in 0.88.2: bundles are no longer mirrored into your S3 bucket. Every download goes to npm or, with `AP_USE_CDN_FOR_BUNDLES=true`, to the CDN.
</Note>

#### What you need to do

Only if your deployment sets `AP_PRE_WARM_CACHE`. Remove it from your environment — it is no longer read. Nothing else is required.
