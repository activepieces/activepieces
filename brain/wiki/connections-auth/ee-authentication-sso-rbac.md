---
icon: 🛡️
---

# EE Authentication (SSO/RBAC)

Enterprise auth layer extending CE with SAML 2.0 SSO, Google/GitHub federated OAuth, OTP email flows, per-project RBAC, and managed-auth JWT exchange for embedding. All SSO paths delegate to `authenticationService.federatedAuthn()` which creates/links a user and issues a standard AP JWT.

### Entities & services
- `saml-authn/`, `federated-authn/`, `otp/`, `enterprise-local-authn/`, `project-role/` (RBAC), `ee-authorization.ts` (preHandler hooks), `managed-authn/`.
- `platform.federatedAuthProviders` stores `{ saml: {entityId, ssoUrl, certificate}, google: {clientId, clientSecret} }`.

### How it works
- **SAML SSO**: `POST /v1/authn/saml/login` returns IdP redirect; IdP POSTs assertion to ACS `POST /v1/authn/saml/acs`; service parses email/name → federatedAuthn → JWT. Gated by `platform.plan.ssoEnabled`.
- **Federated OAuth (Google/GitHub)**: `/v1/authn/federated/login` returns redirect URL; `/v1/authn/federated/claim` exchanges code → JWT. Redirects always use `FRONTEND_URL` (no custom domain).
- **OTP** (`EMAIL_VERIFICATION`, `PASSWORD_RESET`): 10-min expiry + 10-min resend window; states PENDING/CONFIRMED.
- **Enterprise local auth**: `verifyEmail` (confirms OTP → sets verified), `resetPassword` (confirms OTP → updates hash), both audit-logged.
- **RBAC**: `assertPrincipalAccessToProject({principal, permission, projectId})` and `assertUserHasPermissionToFlow` (maps FlowOperationType → Permission). Authorization hooks: `platformMustHaveFeatureEnabled` (402 FEATURE_DISABLED), `projectMustBeTeamType`, `platformMustBeOwnedByCurrentUser`.

### Gotchas
- CE gets OTP flows + RBAC base types; **SSO, managed auth, federated OAuth are EE/Cloud only**.
- SSO settings page wrapped in `LockedFeatureGuard` keyed on `ssoEnabled`.
- Managed auth gated separately by `embeddingEnabled` (signing keys). See the Managed Auth page.

### Key files
Entry point: `assertPrinicpalAccessToProject` (yes, misspelled in the source), exported from `project-role/rbac-service.ts` and called from `core/security/v2/authz/authorize.ts` on every project-scoped request.

- `packages/server/api/src/app/ee/authentication/` — EE auth module root: `saml-authn/`, `federated-authn/`, `otp/`, `enterprise-local-authn/`, `project-role/` (RBAC service + middleware), and `ee-authorization.ts` plan/ownership hooks
- `packages/server/api/src/app/core/security/v2/authz/` — where RBAC gets wired into request authorization
- `packages/server/api/src/app/ee/managed-authn/` — managed auth JWT exchange for the embedding SDK
- `packages/core/shared/src/lib/ee/authn/` — shared enterprise authn exports, ACL types, verify-email and reset-password DTOs
- `packages/core/shared/src/lib/ee/otp/` — OTP model schema and the `OtpType` enum
- `packages/web/src/features/authentication/` — sign-in form, third-party login buttons, verify email, reset password, auth hooks, managed auth client
- `packages/web/src/app/routes/platform/security/sso/` — SSO settings page, SAML dialog, allowed domains dialog
- `packages/web/src/app/routes/authenticate/` — SAML ACS callback landing page

Paths verified 2026-07-17. An earlier version pointed at `sso/oauth2-dialog.tsx`; that file is gone and Google is now a plain `googleAuthEnabled` toggle on the SSO page, so it was dropped.
