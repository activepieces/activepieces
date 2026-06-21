# Authentication & Security

How users prove who they are and how security-relevant actions are recorded: identities, embedded/federated sign-in, enterprise SSO and provisioning, and audit logging.

## Language

**UserIdentity**:
The authentication identity record (email, password hash, provider, verified flag) — one identity can map to users across multiple platforms.
_Avoid_: account, identity

**tokenVersion**:
An incrementing counter on `UserIdentity`; bumping it invalidates all existing JWT sessions for that identity.

**Managed Auth**:
JWT-based authentication for embedded Activepieces — exchanges an external token for an AP session with an auto-provisioned user/project.
_Avoid_: embedded auth, external token

**Federated Auth**:
Authentication via external identity providers (Google, GitHub) using OAuth2 code exchange.
_Avoid_: social login, SSO

**SAML**:
Enterprise SSO via the SAML 2.0 protocol — login request, IdP redirect, ACS callback, assertion parsing.

**SCIM**:
The SCIM 2.0 provisioning protocol that syncs users and groups from an IdP (Okta, etc.) to platform users and projects.
_Avoid_: user provisioning, directory sync

**OTP**:
A one-time password (10-minute expiry) used for email verification and password-reset flows.
_Avoid_: verification code

**Audit Event**:
A persisted record of a security-relevant action for compliance and forensic review.
_Avoid_: audit log entry
