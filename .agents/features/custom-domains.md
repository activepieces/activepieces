# Custom Domains (White-Label Domains)

## Summary
Custom Domains allow platform owners to serve the Activepieces UI and API from their own subdomain instead of the default Activepieces domain. On Cloud, newly registered domains start in `PENDING` state and must be verified (DNS validation) before becoming `ACTIVE`. On self-hosted Enterprise, domains are immediately set to `ACTIVE`. The `domainHelper` utility resolves URLs platform-aware: when a platform has an active custom domain, links in emails and notifications use that domain instead of the default frontend URL. Gated by `platform.plan.customDomainsEnabled`.

## Key Files
- `packages/server/api/src/app/ee/custom-domains/custom-domain.module.ts` — module registration with `platformMustHaveFeatureEnabled` guard
- `packages/server/api/src/app/ee/custom-domains/custom-domain.service.ts` — CRUD service
- `packages/server/api/src/app/ee/custom-domains/custom-domain.entity.ts` — TypeORM entity
- `packages/server/api/src/app/ee/custom-domains/domain-helper.ts` — URL resolution utilities used across the codebase
- `packages/shared/src/lib/ee/custom-domains/index.ts` — `CustomDomain`, `CustomDomainStatus`, `AddDomainRequest`, `ListCustomDomainsRequest` types

## Edition Availability
Enterprise and Cloud. Gated by `platform.plan.customDomainsEnabled`. On Cloud, the `create` service method sets status to `PENDING`; on self-hosted Enterprise it is immediately `ACTIVE`.

## Domain Terms
- **CustomDomain**: A domain record associating a hostname with a platform.
- **CustomDomainStatus**: `ACTIVE` (domain is live) or `PENDING` (awaiting DNS verification, Cloud only).
- **domainHelper**: Utility that resolves public URLs for emails and links, preferring the platform's custom domain when available.

## Entity

Table name: `custom_domain`

| Column | Type | Notes |
|---|---|---|
| id | ApId | PK |
| created | string | From BaseColumnSchemaPart |
| updated | string | From BaseColumnSchemaPart |
| domain | string | Fully-qualified hostname (unique across table) |
| platformId | ApId | FK to `platform` (CASCADE DELETE) |
| status | string | `CustomDomainStatus` enum |

Indices:
- `custom_domain_domain_unique` — unique on `domain`
- `idx_custom_domain_platform_id` — non-unique index on `platformId`

## Endpoints

All mount under `/v1/custom-domains`. All require `platformAdminOnly` (`USER` principal).

| Method | Path | Description |
|---|---|---|
| POST | `/v1/custom-domains` | Register a new domain |
| GET | `/v1/custom-domains` | List domains for platform (paginated) |
| DELETE | `/v1/custom-domains/:id` | Remove a domain |

The module also exposes a `verifyDomain` operation via `customDomainService.verifyDomain` (no direct REST endpoint in the EE module; verification is triggered internally or via admin flows).

## Service Methods

- `create({ domain, platformId })` — creates a new domain; status defaults to `PENDING` on Cloud, `ACTIVE` on Enterprise.
- `list({ platformId, request })` — paginated list of domains for a platform.
- `delete({ id, platformId })` — deletes a domain record.
- `getOneByDomain({ domain })` — finds an `ACTIVE` domain by hostname; used during request routing.
- `getOneByPlatform({ platformId })` — finds any domain for a platform; used by `domainHelper`.
- `verifyDomain({ platformId, id })` — transitions status from `PENDING` to `ACTIVE`.
- `getPlatformUrlFromEmail(userEmail)` — looks up all active custom domains and returns the one whose hostname ends with the email's root domain (e.g., `app.acme.com` for `user@acme.com`). Used for auto-redirect on login.

## domainHelper Utilities

The `domainHelper` object is used throughout the server to generate absolute URLs:

- `getPublicUrl({ path, platformId })` — on Cloud with an active custom domain, returns `https://<customDomain>/<path>`; otherwise returns the configured `FRONTEND_URL`.
- `getPublicApiUrl({ path, platformId })` — same as above but prefixes `/api/`.
- `getInternalUrl({ path, platformId })` — uses `INTERNAL_URL` system prop if set; falls back to `getPublicUrl`.
- `getInternalApiUrl({ path, platformId })` — same as `getInternalUrl` but prefixes `/api/`.
- `getApiUrlForWorker({ path, platformId })` — when running as a worker process, uses `http://127.0.0.1:<PORT>/api`; otherwise uses `getInternalApiUrl`.
