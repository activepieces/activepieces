---
icon: 🎫
---

# Managed Auth

Embedded authentication ("Embedding"): lets SaaS vendors embed the Activepieces builder in their own product. The vendor's backend signs a short-lived JWT with an RSA private key (from a Signing Key), passes it to the AP embed SDK, which calls `POST /v1/managed-authn/external-token`. The server verifies the JWT against the stored public key, auto-provisions/retrieves the user + project + limits from the claims, and returns a full `AuthenticationResponse` (with access token). Gated by `platform.plan.embeddingEnabled` (on the signing-key module, not the endpoint).

### Domain terms
- **Signing Key**: RSA key pair; public key stored in AP, private key kept by the vendor. JWT header `kid` = Signing Key ID.
- **externalUserId**: vendor user id; hashed with platformId into a deterministic identity email `sha256("managed_<platformId>_<externalUserId>")` — managed users never have real emails.
- **externalProjectId**: vendor project id; maps to an AP project via `externalId`.

### How it works (`externalToken` flow)
1. `externalTokenExtractor` resolves the signing key by `kid`, verifies RS256, parses the payload.
2. `getOrCreateProject` by `(platformId, externalProjectId)`; creates a TEAM project owned by the platform owner if absent.
3. Optionally set displayName, upsert a concurrency pool.
4. `applyProjectPieceAccess` — assigns the project's named piece set (runs **unconditionally** every exchange, no `managePiecesEnabled` gate here).
5. `getOrCreateUser` by `(platformId, externalUserId)` using the hashed email.
6. Upsert project membership (role defaults `EDITOR`); issue a 7-day AP token.

### Token payload versions
`z.union` ordered most-specific-first `[v4, v3, v2]` (v2 strips unknown keys and would otherwise swallow v3/v4):
- **v1/v2** (no `version` field): legacy nested `pieces` object.
- **v3** (`version: "v3"`): flat `piecesFilterType` + `piecesTags`.
- **v4** (`version: "v4"`): `pieceSet` **required**, is the piece set's **key**.

### Gotchas
- Endpoint is public (`securityAccess.public()`) — the JWT signature is the security.
- Piece-set assignment falls back: explicit `pieceSet` key (v4) → first legacy `piecesTags` entry matched against set `key` → platform Default set (with a warn log if no match). The project plan is not written.

### Key files
Entry point: `managedAuthnModule`, registered in `packages/server/api/src/app/app.ts` under the `/v1/managed-authn` prefix.

- `packages/server/api/src/app/ee/managed-authn/` — the whole feature: module, controller (single `POST /external-token`), service (provisioning + token issuance), and `lib/external-token-extractor.ts` (JWT verify, v2/v3/v4 payload parsing).
- `packages/server/api/src/app/ee/signing-key/` — signing key CRUD and generation; this is where the `embeddingEnabled` plan gate sits.
- `packages/core/shared/src/lib/ee/managed-authn/` — `ManagedAuthnRequestBody` and the shared wire contract.
- `packages/web/src/features/authentication/api/managed-auth-api.ts` — frontend API client used by the embed SDK integration.

Paths verified 2026-07-17.
