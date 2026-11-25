---
id: release-0-87-0
title: "0.87.0"
added: '2026-08-04'
release: 0.87.0
legacy: true
---

### What has changed?

#### Plans and credits are now managed by our billing service

Two license-key endpoints are removed: `GET /v1/license-keys/:licenseKey` and `POST /v1/license-keys/verify`. Applying a key is now `POST /v1/platform-billing/activate`.

Four feature flags no longer appear in `GET /v1/flags`: `SHOW_BILLING_PAGE`, `CAN_BUY_ACTIVE_FLOWS`, `CAN_BUY_AI_CREDITS` and `SHOW_BILLING_LIMITS_ON_SIDEBAR`. Whether the billing page appears is now decided from the edition and plan instead.

#### Enterprise instances without a license key are placed on the free plan
An Enterprise-edition instance with no license key previously ran with no credit enforcement. It is now enrolled on the free plan, so credit limits apply to it. Entering your license key restores your contracted limits.

#### Running out of credits now stops production flow runs
When a platform has no credits left, new production runs are recorded with the `QUOTA_EXCEEDED` status instead of executing, and synchronous webhooks respond with HTTP 402. Such a run keeps its trigger payload, so it can be retried once credits are available. Test runs are unaffected.

#### The AI piece offers only the named model tiers for Activepieces-provided AI
In the AI piece, picking the Activepieces-provided AI now lists only the named tiers (Fast, Expert, Heavy) rather than the full upstream model catalogue. Existing steps keep running on the model they already have, but that model no longer appears in the dropdown, so re-saving the step moves it onto one of the tiers.

### Do you need to take action?
- Only if you run the Enterprise edition without a license key. Enter your key so your contracted limits apply instead of the free plan's.
- Only if you call `GET /v1/license-keys/:licenseKey` or `POST /v1/license-keys/verify`. Both are removed — use `POST /v1/platform-billing/activate` instead.
- Only if you read `SHOW_BILLING_PAGE`, `CAN_BUY_ACTIVE_FLOWS`, `CAN_BUY_AI_CREDITS` or `SHOW_BILLING_LIMITS_ON_SIDEBAR` from `GET /v1/flags`. They no longer exist.
- Only if a flow uses Activepieces-provided AI on a model outside the Fast/Expert/Heavy tiers. Choose a tier the next time you edit that step.
- No database action is required. The migration only adds columns and leaves the existing ones in place.

#### Official piece bundles are served from the Activepieces CDN by default
`AP_USE_CDN_FOR_BUNDLES` now defaults to `true`. When an official piece bundle is not already cached in your own S3 bucket, the engine is redirected to `cdn.activepieces.com` for the tarball instead of `registry.npmjs.org`. If the CDN does not have that piece version, the download falls back to npm automatically, so installs keep working either way. Custom pieces and pieces from a private registry never use the CDN and are unaffected.

### Do you need to take action?
- Only if your network policy restricts outbound traffic. Allow `cdn.activepieces.com`, or set `AP_USE_CDN_FOR_BUNDLES=false` to keep serving official bundles from npm.

<Note>
Reverted in 0.88.2: `AP_USE_CDN_FOR_BUNDLES` defaults to `false` again, so official bundles are served from npm by default. Set it to `true` to opt back into the CDN. The S3 cache mentioned above was removed in the same release.
</Note>
