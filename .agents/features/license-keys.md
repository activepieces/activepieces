# License Keys (License Activation)

## Summary
License Keys are the mechanism by which self-hosted Enterprise customers activate and maintain their subscription. A license key is a string that encodes which EE features are enabled (SSO, SCIM, audit logs, custom domains, etc.) and an expiry date. The key is validated against Activepieces' remote secrets service (`https://secrets.activepieces.com/license-keys`). When valid, the key's feature flags are written to the platform's `plan` object, enabling gated features. A background job runs daily to re-validate every platform's license key and downgrade to a free plan if the key has expired. The endpoints are public (no auth required) since they are used during self-hosted setup before authentication is configured.

## Key Files
- `packages/server/api/src/app/ee/license-keys/license-keys-module.ts` — module registration, schedules daily `TRIAL_TRACKER` job
- `packages/server/api/src/app/ee/license-keys/license-keys-controller.ts` — REST controller (get key info, verify and apply)
- `packages/server/api/src/app/ee/license-keys/license-keys-service.ts` — service (validate, apply limits, downgrade, request trial)
- `packages/shared/src/lib/core/license-keys/index.ts` — `LicenseKeyEntity`, `VerifyLicenseKeyRequestBody`, `CreateTrialLicenseKeyRequestBody` types
- `packages/web/src/features/billing/components/license-key.tsx` — frontend license key display component
- `packages/web/src/features/billing/components/activate-license-dialog.tsx` — activation dialog
- `packages/web/src/app/routes/platform/billing/index.tsx` — billing/license page

## Edition Availability
Primarily Enterprise self-hosted (`AP_EDITION=ee`). Also used on Cloud for internal plan management. The endpoints are public and available in all editions, but license keys only have effect when applied to a platform.

## Domain Terms
- **LicenseKeyEntity**: The object returned by the remote secrets service describing what features a key enables.
- **Trial key**: A key with `isTrial: true`; requested via `requestTrial()`.
- **TRIAL_TRACKER**: A BullMQ system job (cron `*/59 23 * * *`, effectively daily) that re-validates all platforms' license keys.
- **applyLimits**: The operation that translates `LicenseKeyEntity` feature flags into the platform's `plan` object.
- **downgradeToFreePlan**: Sets all plan feature flags to `false` when a license key expires.

## Endpoints

All mount under `/v1/license-keys`. Both endpoints use `securityAccess.public()` (no authentication required).

| Method | Path | Description |
|---|---|---|
| GET | `/v1/license-keys/:licenseKey` | Fetch key metadata from remote secrets service |
| POST | `/v1/license-keys/verify` | Verify a key and apply its limits to the platform |

Request body for verify: `{ licenseKey: string, platformId: string }`.  
Returns `LicenseKeyEntity` on success, or `INVALID_LICENSE_KEY` error if expired/not found.

## Service Methods

- `getKey(license)` — fetches key metadata from `https://secrets.activepieces.com/license-keys/<license>`. Returns `null` if not found or `license` is nil.
- `verifyKeyOrReturnNull({ platformId, license })` — marks key as activated, fetches metadata, checks expiry. Returns `null` if nil or expired.
- `applyLimits(platformId, key)` — maps all `LicenseKeyEntity` boolean flags to `platformService.update` and `platformPlanService.update`. Determines `PlanName.ENTERPRISE` vs `internal` plan based on flags.
- `requestTrial(request)` — calls `POST https://secrets.activepieces.com/license-keys` to create a trial key. Throws `EMAIL_ALREADY_HAS_ACTIVATION_KEY` on 409 conflict.
- `markAsActiviated({ key, platformId? })` — calls the remote `activate` endpoint; fires `KEY_ACTIVATED` telemetry event.
- `extendTrial({ email, days })` — admin-only method calling the remote service with `SECRET_MANAGER_API_KEY` header.
- `downgradeToFreePlan(platformId)` — sets all feature flags to `false` in the platform plan.

## LicenseKeyEntity Fields

The remote secrets service returns an object with these feature flags:

| Field | Type | Activates |
|---|---|---|
| `key` | string | Key string itself |
| `email` | string | Licensee email |
| `expiresAt` | string | Expiry ISO date |
| `ssoEnabled` | boolean | SSO/SAML |
| `scimEnabled` | boolean | SCIM provisioning |
| `environmentsEnabled` | boolean | Multiple environments |
| `showPoweredBy` | boolean | "Powered by Activepieces" branding |
| `embeddingEnabled` | boolean | Managed auth / embed SDK |
| `auditLogEnabled` | boolean | Audit logs |
| `customAppearanceEnabled` | boolean | White-label branding |
| `manageProjectsEnabled` | boolean | Team projects (unlimited) |
| `managePiecesEnabled` | boolean | Piece management |
| `manageTemplatesEnabled` | boolean | Template management |
| `apiKeysEnabled` | boolean | Platform API keys |
| `customDomainsEnabled` | boolean | Custom domains |
| `projectRolesEnabled` | boolean | Custom project roles |
| `analyticsEnabled` | boolean | Analytics dashboard |
| `globalConnectionsEnabled` | boolean | Global connections |
| `customRolesEnabled` | boolean | Custom roles |
| `eventStreamingEnabled` | boolean | Event streaming |
| `secretManagersEnabled` | boolean | Secret managers |
| `agentsEnabled` | boolean | Agents |
| `aiProvidersEnabled` | boolean | AI providers |
| `isTrial` | boolean | Whether this is a trial key |

## Background Job

The `TRIAL_TRACKER` system job runs at `*/59 23 * * *` (approximately daily at 23:59). For every platform:
1. Skips platforms with no `licenseKey`.
2. Calls `verifyKeyOrReturnNull`; if null (expired), calls `downgradeToFreePlan`.
3. If valid, calls `applyLimits` to refresh the platform plan with current key flags.

## Remote Service
All interactions go to `https://secrets.activepieces.com/license-keys`. This is Activepieces' central licensing service. The `SECRET_MANAGER_API_KEY` system env var is required for admin operations like `extendTrial`.
