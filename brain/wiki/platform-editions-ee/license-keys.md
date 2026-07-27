---
icon: 🔑
---

# License Keys

License Keys are how self-hosted Enterprise customers activate and maintain their subscription. A key is a string encoding which EE features are enabled (SSO, SCIM, audit logs, custom domains, etc.) plus an expiry date. It's validated against the remote secrets service (`https://secrets.activepieces.com/license-keys`); when valid, its flags are written to the platform's `plan`, enabling gated features. Primarily EE self-hosted (`AP_EDITION=ee`); also used on Cloud for internal plan management.

### How it works
- `getKey(license)` — fetches metadata from the remote service; null if not found/nil.
- `verifyKeyOrReturnNull({ platformId, license })` — marks activated, fetches metadata, checks expiry; null if nil or expired.
- `applyLimits(platformId, key)` — maps every `LicenseKeyEntity` boolean flag onto `platformService.update` + `platformPlanService.update`; picks `PlanName.ENTERPRISE` vs internal based on flags.
- `requestTrial(request)` — creates a trial key (`isTrial`); throws `EMAIL_ALREADY_HAS_ACTIVATION_KEY` on 409.
- `markAsActiviated`, `extendTrial` (admin-only, uses `SECRET_MANAGER_API_KEY`), `downgradeToFreePlan` (all flags → false).

### Endpoints (`/v1/license-keys`, both public — no auth)
- `GET /:licenseKey` — fetch metadata.
- `POST /verify` — body `{ licenseKey, platformId }`; returns `LicenseKeyEntity` or `INVALID_LICENSE_KEY` if expired/not found.

### Background job
`TRIAL_TRACKER` (cron `59 23 * * *`, once daily at 23:59 UTC): for each platform, skip if no key, else `verifyKeyOrReturnNull` → `downgradeToFreePlan` if expired, else `applyLimits` to refresh flags. The cron was `*/59 23 * * *` until GIT-1632 — on the minutes field `*/59` means "minutes divisible by 59", so the sweep fired twice nightly (23:00 and 23:59).

### Gotchas
- Endpoints are **public on purpose** — used during self-hosted setup before auth exists.
- `LicenseKeyEntity` flags include `ssoEnabled`, `scimEnabled`, `environmentsEnabled`, `embeddingEnabled`, `auditLogEnabled`, `customAppearanceEnabled`, `manageProjectsEnabled`, `managePiecesEnabled`, `manageTemplatesEnabled`, `apiKeysEnabled`, `customDomainsEnabled`, `projectRolesEnabled`, `customRolesEnabled`, `analyticsEnabled`, `globalConnectionsEnabled`, `eventStreamingEnabled`, `secretManagersEnabled`, `agentsEnabled`, `aiProvidersEnabled`, `workerGroupsEnabled`, plus `expiresAt`, `email`, `isTrial`.
- `SECRET_MANAGER_API_KEY` env var required for admin ops like `extendTrial`.

### Key files
Entry point: `licenseKeysService`, a log-taking factory in license-keys-service.ts, called from the controller, the TRIAL_TRACKER job in license-keys-module.ts, and admin-platform.service.ts.

- `packages/server/api/src/app/ee/license-keys/` — module (registers controller + schedules TRIAL_TRACKER), controller, and service. Registered in `packages/server/api/src/app/app.ts`.
- `packages/core/shared/src/lib/core/license-keys/index.ts` — `LicenseKeyEntity`, `VerifyLicenseKeyRequestBody`, `CreateTrialLicenseKeyRequestBody` types.
- `packages/web/src/features/billing/components/` — `license-key.tsx` (key display) and `activate-license-dialog.tsx` (activation flow), among the other billing components.
- `packages/web/src/app/routes/platform/billing/index.tsx` — the billing/license page that renders them.

Paths verified 2026-07-17.
