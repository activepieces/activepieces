---
id: plans-and-credits-are-now-managed-by-our-billing-service
title: "Plans and credits are now managed by our billing service"
added: '2026-08-04'
order: 1
release: 0.87.0
---

Two license-key endpoints are removed: `GET /v1/license-keys/:licenseKey` and `POST /v1/license-keys/verify`. Applying a key is now `POST /v1/platform-billing/activate`.

Four feature flags no longer appear in `GET /v1/flags`: `SHOW_BILLING_PAGE`, `CAN_BUY_ACTIVE_FLOWS`, `CAN_BUY_AI_CREDITS` and `SHOW_BILLING_LIMITS_ON_SIDEBAR`. Whether the billing page appears is now decided from the edition and plan instead.

#### What you need to do

- Only if you call `GET /v1/license-keys/:licenseKey` or `POST /v1/license-keys/verify`. Both are removed — use `POST /v1/platform-billing/activate` instead.
- Only if you read `SHOW_BILLING_PAGE`, `CAN_BUY_ACTIVE_FLOWS`, `CAN_BUY_AI_CREDITS` or `SHOW_BILLING_LIMITS_ON_SIDEBAR` from `GET /v1/flags`. They no longer exist.
- No database action is required. The migration only adds columns and leaves the existing ones in place.
