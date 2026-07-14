# Encryption at rest migrated from AES-256-CBC to AES-256-GCM

## Status

accepted

## Context

Every secret Activepieces stores at rest — app-connection credentials, project variables, AI
provider/tool keys, EE OAuth-app secrets, secret-manager configs, and the OIDC signing key — is
encrypted through one chokepoint, `encryptUtils` in `encryption.ts`, historically with
**AES-256-CBC** and the stored shape `{ iv, data }`. CBC provides confidentiality only: it has no
authentication tag, so tampering with a stored ciphertext is undetectable. We wanted authenticated
encryption (**AES-256-GCM**) and to retire CBC entirely, not merely stop writing it.

Two properties constrained the design. First, there is **no plaintext fallback**: if a running
process cannot decrypt a blob, that secret is unrecoverable. Second, the change is at cloud scale —
`app_connection` alone can hold millions of rows — so any re-encryption must trickle, not spike the
database, and must survive restarts and concurrent writes.

The 32-character `AP_ENCRYPTION_KEY` is already a valid 32-byte AES-256 key for GCM
(`Buffer.from(secret, 'binary')`), so no key rotation and no new env var were needed; self-hosting
stays zero-setup. Key rotation is a separate concern and was explicitly deferred.

## Decision

**Discriminate formats by the presence of `authTag`.** `EncryptedObject` became
`{ iv, data, authTag? }`: `authTag` absent ⇒ legacy CBC, present ⇒ GCM. No version field, no
`keyId`, no keyring — if key rotation is ever needed, an optional `keyId` can be added later with no
further format migration.

**Roll out as expand → migrate → contract, three releases.** Because there is no plaintext fallback
and a process on the *previous* release has no GCM reader, GCM writes must not begin until the reader
is fleet-wide:
1. **Expand** — add the GCM read branch; keep writing CBC. Dormant everywhere, fully rollback-safe.
2. **Migrate** — flip `encryptString` to GCM (12-byte IV + auth tag) and run a background sweep
   (`reencryptSecretsJob`) that re-encrypts legacy blobs in place. Keyset-paginated on the primary
   key, paced, single-runner via `distributedLock`, restart-safe, idempotent, re-enqueued each boot.
   Write-back is conditional on the **exact CBC blob read** (not merely `authTag IS NULL`), so a
   concurrent re-auth — including a CBC write from a not-yet-upgraded instance during the rollout —
   is never clobbered; such a row is simply left for a later sweep.
3. **Contract** (later) — once legacy counts are zero fleet-wide for a full release cycle, delete the
   CBC read branch, make `authTag` required, and remove the sweep job.

## Consequences

- Stored secrets are tamper-evident under GCM; CBC is read-only and time-boxed to removal in the
  contract release.
- Two formats coexist during migration — intentional and readable via the `authTag` discriminator.
- Rollout safety is load-bearing on ordering: Release 1 must reach 100% of instances before Release 2
  ships. The reward is that every step is independently rollback-safe.
- A dual-column (`iv2`/`data2`) scheme was rejected: it doubles storage on the largest table, forces
  a second full rewrite (or permanent awkward field names) at cleanup, and keeps minting fresh CBC
  for newly created rows — trading a cheap sequencing discipline for a heavier, longer-lived one.
- Key entropy is unchanged (`openssl rand -hex 16` seeds ~128-bit into the 32-byte key). 128-bit is
  cryptographically secure; raising it would require a longer key and thus key rotation, which is out
  of scope here.
