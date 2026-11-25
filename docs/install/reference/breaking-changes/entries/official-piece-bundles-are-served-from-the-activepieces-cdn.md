---
id: official-piece-bundles-are-served-from-the-activepieces-cdn
title: "Official piece bundles are served from the Activepieces CDN by default"
added: '2026-08-04'
order: 5
release: 0.87.0
---

`AP_USE_CDN_FOR_BUNDLES` now defaults to `true`. When an official piece bundle is not already cached in your own S3 bucket, the engine is redirected to `cdn.activepieces.com` for the tarball instead of `registry.npmjs.org`. If the CDN does not have that piece version, the download falls back to npm automatically, so installs keep working either way. Custom pieces and pieces from a private registry never use the CDN and are unaffected.

<Note>
Reverted in 0.88.2: `AP_USE_CDN_FOR_BUNDLES` defaults to `false` again, so official bundles are served from npm by default. Set it to `true` to opt back into the CDN. The S3 cache mentioned above was removed in the same release.
</Note>

#### What you need to do

Only if your network policy restricts outbound traffic. Allow `cdn.activepieces.com`, or set `AP_USE_CDN_FOR_BUNDLES=false` to keep serving official bundles from npm.
