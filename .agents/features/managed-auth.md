# Managed Auth (Embedded Authentication)

## Summary
Managed Auth (also called "Embedding" or "Managed Authentication") enables SaaS vendors to embed the Activepieces workflow builder inside their own product. The vendor's backend signs a short-lived JWT using an RSA private key (from a Signing Key), then passes it to the Activepieces embed SDK. The SDK calls `POST /v1/managed-authn/external-token` with that JWT. The backend verifies the JWT against the stored public key, then auto-provisions or retrieves the user, project, and project limits defined in the token claims, and returns a full Activepieces `AuthenticationResponse` (including an access token). This feature is gated by `platform.plan.embeddingEnabled`.

## Key Files
- `packages/server/api/src/app/ee/managed-authn/managed-authn-module.ts` — module registration (no plan gate at module level; gate is on signing-key module)
- `packages/server/api/src/app/ee/managed-authn/managed-authn-controller.ts` — single `POST /external-token` endpoint
- `packages/server/api/src/app/ee/managed-authn/managed-authn-service.ts` — orchestration: token extraction, user/project provisioning, token issuance
- `packages/server/api/src/app/ee/managed-authn/lib/external-token-extractor.ts` — JWT verification using the platform's signing key; parses v2/v3/v4 token payloads
- `packages/core/shared/src/lib/ee/managed-authn/managed-authn-requests.ts` — `ManagedAuthnRequestBody` schema
- `packages/web/src/features/authentication/api/managed-auth-api.ts` — frontend API client (used by embed SDK integration)

## Edition Availability
Enterprise and Cloud. The endpoint itself is public (`securityAccess.public()`), but functional only when valid signing keys exist. Signing keys are gated by `platform.plan.embeddingEnabled`.

## Domain Terms

> Canonical term definitions live in the bounded-context glossaries — see [CONTEXT-MAP.md](../../CONTEXT-MAP.md).

- **External Access Token**: A signed JWT issued by the vendor's backend, containing user and project information.
- **Signing Key**: An RSA key pair registered on the platform; the public key is stored in Activepieces, the private key is kept by the vendor.
- **External Principal**: The parsed, verified identity extracted from the JWT (platformId, externalUserId, externalProjectId, etc.).
- **externalUserId**: Vendor-assigned stable user identifier; hashed with platformId to create an Activepieces identity email (`managed_<platformId>_<externalUserId>`).
- **externalProjectId**: Vendor-assigned stable project identifier; maps to an Activepieces project via `externalId`.
- **Concurrency Pool**: Optional concurrency limit that can be assigned to a project via JWT claims.

## Endpoint

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/v1/managed-authn/external-token` | Public | Exchange external JWT for Activepieces session token |

Request body: `{ externalAccessToken: string }`.  
Response: `AuthenticationResponse` (same shape as standard sign-in response, includes `token` and `projectId`).

## Token Payload Versions

The extractor supports these token versions. Each version carries **one** piece-access model, and the `z.union` is ordered most-specific-first (`[v4, v3, v2]`) because `v2` strips unknown keys and would otherwise swallow a `v3`/`v4` token:

**v1/v2** (implicit — no `version` field): legacy nested `pieces` object.
```
{ externalUserId, externalProjectId, firstName, lastName, role?, pieces?, concurrencyPoolKey?, concurrencyPoolLimit? }
```

**v3** (explicit `version: "v3"`): flat tag filter.
```
{ version: "v3", externalUserId, externalProjectId, firstName, lastName, role?, piecesFilterType?, piecesTags?, concurrencyPoolKey?, concurrencyPoolLimit? }
```

**v4** (explicit `version: "v4"`): piece-set native. `pieceSet` is **required** and is the piece set's **key**.
```
{ version: "v4", externalUserId, externalProjectId, firstName, lastName, role?, pieceSet, concurrencyPoolKey?, concurrencyPoolLimit? }
```

The JWT header must include `kid` set to the Signing Key ID.

The `pieceSet` claim (v4 only) is a piece-set **key**. `applyProjectPieceAccess` runs **unconditionally** on every token exchange — there is no `managePiecesEnabled` gate here. (That flag gates only the piece-set *management* endpoints and the new-project default-set assignment in `ee-project-hooks.ts`, never this enforcement path.) The project is assigned a **named** piece set — the explicit `pieceSet` key (v4); else (legacy v2/v3 claims) the **first** `piecesTags` entry matched against set `key` (the backfill migration created one named set per tag, `key = tagName`); else the platform Default set (also the fallback, with a warn log, when the key matches no set). The project plan is **not** written.

See [piece-sets.md](./piece-sets.md).

## Service Flow (`externalToken`)

1. Extract and verify the JWT using `externalTokenExtractor` (resolves signing key by `kid` header, verifies with RS256).
2. Call `getOrCreateProject` — looks up project by `(platformId, externalProjectId)`; if absent, creates a new `TEAM` type project owned by the platform owner.
3. Optionally update the project's `displayName` from `projectDisplayName` claim.
4. Optionally upsert a concurrency pool and assign it to the project.
5. Call `applyProjectPieceAccess` — assigns the project's named piece set (`pieceSet` key → first legacy tag matched against set `key` → Default set). Runs unconditionally on every token exchange, so claim/tag changes take effect at the next embed sign-in.
6. Call `getOrCreateUser` — finds user by `(platformId, externalUserId)`; if absent, creates a user identity using a deterministic hashed email (`managed_<platformId>_<externalUserId>` SHA-256), then creates the platform user.
7. Upsert project membership with the specified role (defaults to `EDITOR`).
8. Generate a 7-day Activepieces access token and return the full `AuthenticationResponse`.

## Identity Hashing
User emails for managed users are never real emails. The identity email is derived as:
```
sha256("managed_<platformId>_<externalUserId>").toLowerCase()
```
This ensures stable, deterministic, non-conflicting identities across vendors.
