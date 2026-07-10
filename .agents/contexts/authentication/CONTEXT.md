# Authentication & Security

How identities log in and what they're allowed to do: federated and embedded auth, RBAC, audit trails, and secret storage.

## Language

**UserIdentity**:
The authentication identity record (email, password hash, provider, verified flag) — one identity can map to users across multiple platforms.
_Avoid_: account, identity

**tokenVersion**:
An incrementing counter on UserIdentity; bumping it invalidates all existing JWT sessions for that identity.

**OTP**:
A one-time password (10-min expiry) used for email verification and password reset flows.
_Avoid_: verification code

**Federated Auth**:
Authentication via external identity providers (Google, GitHub) using OAuth2 code exchange.
_Avoid_: social login, SSO

**Managed Auth**:
JWT-based authentication for embedded Activepieces — exchanges an external token for an AP session with auto-provisioned user/project.
_Avoid_: embedded auth, external token

**SAML**:
Enterprise SSO via SAML 2.0 protocol — login request, IdP redirect, ACS callback, assertion parsing.

**SCIM**:
SCIM 2.0 provisioning protocol that syncs users and groups from an IdP (Okta, etc.) to platform users and projects.
_Avoid_: user provisioning, directory sync

**RBAC**:
Role-Based Access Control — enforcement of permissions based on a user's ProjectRole within a project.
_Avoid_: authorization, ACL

**Audit Event**:
A persisted record of a security-relevant action (19 event types) for compliance and forensic review.
_Avoid_: audit log entry

**Secret Manager**:
An external vault integration (AWS Secrets Manager, HashiCorp Vault, CyberArk Conjur, 1Password) for storing connection secrets outside Activepieces.
_Avoid_: vault, credential store
