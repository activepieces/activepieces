---
id: official-piece-bundles-are-served-from-npm-again-by-default
title: "Official piece bundles are served from npm again by default"
added: '2026-09-16'
release: 0.88.2
---

`AP_USE_CDN_FOR_BUNDLES` goes back to defaulting to `false`, reversing the change in 0.87.0. Official piece bundles are downloaded from `registry.npmjs.org` instead of `cdn.activepieces.com`. When the flag is switched on, the CDN serves the repackaged, self-contained tarballs from `https://cdn.activepieces.com/pieces/bundled/`. The same release stops mirroring bundles into your own S3 bucket: a bundle that was copied there is no longer served from it, and every download goes to npm or the CDN.

#### What you need to do

If your network policy restricts outbound traffic, allow `registry.npmjs.org`: it is the default source, and it stays the fallback for any bundle the CDN does not have even when `AP_USE_CDN_FOR_BUNDLES=true`. Set the flag to `true` to prefer the CDN, and allow `cdn.activepieces.com` as well in that case. Otherwise nothing.
