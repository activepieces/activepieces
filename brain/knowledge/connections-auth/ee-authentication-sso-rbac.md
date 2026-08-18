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
- **OTP** (`EMAIL_VERIFICATION`, `PASSWORD_RESET`, `EMAIL_LOGIN`): per-type expiry (`OTP_EXPIRATION_MS` in `otp-service.ts`: 24h verification, 10-min reset, 10-min login); states PENDING/CONFIRMED; one row per `(identityId, type)`, DB-enforced. Resend re-delivers the existing pending value WITHOUT touching the row — expiry stays anchored to the value's creation, so resends cannot extend a (possibly compromised) OTP's lifetime; a new value is generated only once the old one is expired or spent (GIT-1733: the old early-return made resend a silent 204 no-op). The first two types carry a `randomUUID()` delivered as a link; `EMAIL_LOGIN` carries a 6-digit code the member types, and its row counts `attempts` so it dies after five wrong guesses — counted in raw SQL for the same reason resend leaves the row alone, since touching `updated` would buy the guesser another window. Known bounded edge: a resend requested just before expiry delivers a short-lived link; the next resend regenerates. See [000027](../decisions/000027-email-sign-in-is-a-typed-code-on-the-existing-otp-primitive.md).
- **Enterprise local auth**: `verifyEmail` (confirms OTP → sets verified), `resetPassword` (confirms OTP → updates hash), both audit-logged.
- **RBAC**: `assertPrincipalAccessToProject({principal, permission, projectId})` and `assertUserHasPermissionToFlow` (maps FlowOperationType → Permission). Authorization hooks: `platformMustHaveFeatureEnabled` (402 FEATURE_DISABLED), `projectMustBeTeamType`, `platformMustBeOwnedByCurrentUser`.

### Gotchas
- **Until the passwordless work, CE could not send an OTP at all, despite the entity being registered for every edition.** `otpModule` was registered only in the CLOUD and ENTERPRISE arms of `app.ts`, and `emailService.sendOtp` returned early when the edition was neither. So on CE the table existed, the migration ran, and nothing could ever be sent. `EMAIL_LOGIN` changed that: `otpModule` is now registered for COMMUNITY too, and `EMAIL_LOGIN` is the one type carved out of the paid-edition send gate, so it reaches every edition while the UI gates it on `SMTP_CONFIGURED`. The two link types are still paid-edition only. RBAC base types are CE; **SSO, managed auth, federated OAuth are EE/Cloud only**.
- **The public `POST /v1/otp` route deliberately cannot mint a login code.** Its `CreateOtpRequestBody` narrows `type` to `EMAIL_VERIFICATION | PASSWORD_RESET`, because that route is unauthenticated, carries no `rateLimit` config, and applies none of the sign-up guards. `EMAIL_LOGIN` is issued only through `POST /v1/authentication/otp/request`, which is rate limited and gated. Widening that enum back to the whole `OtpType` hands anyone an unthrottled "email a working sign-in code to this address" primitive.
- **A code sign-in must re-assert the platform's auth policy at verify time, not only at request time.** On Cloud `platformUtils.getPlatformIdForRequest` returns null for every unauthenticated request, so the request-scoped branch never runs there and the platform is only known after the identity is resolved. `verifyCode` therefore calls the same `assertEmailAuthIsEnabled` + `assertDomainIsAllowed` pair on the resolved preferred platform; without that, an email code signs a member into a platform that has deliberately disabled email auth or removed their domain. It is not asserted at request time on purpose, because reporting those errors for a resolved address would turn the request endpoint into an existence oracle.
- **`otpService.confirm` used to refresh its own resend lock.** `updated` is an `updateDate` column, so marking a row CONFIRMED touched it and the ten-minute guard then refused to issue that identity another code for ten minutes after a successful verify. Rows are deleted on confirm now.
- **One constant is both the expiry and the resend suppression.** `TEN_MINUTES` gates `confirm`'s freshness check and `createAndSend`'s "an OTP already exists" early return, so before this work a resend was impossible until the current credential expired, and the request endpoint still answered 204. Resend now re-delivers the existing value without touching `updated`.
- **`email-service.ts` is not exhaustive over `OtpType`.** `frontendPath` is a literal keyed by only two members but indexed by the whole union, so adding a member is a compile break; its sibling `otpToTemplate` is typed `Record<string, EmailTemplateData>`, which type-checks and hands `undefined` to the sender at runtime instead.
- SSO settings page wrapped in `LockedFeatureGuard` keyed on `ssoEnabled`.
- Managed auth gated separately by `embeddingEnabled` (signing keys). See the Managed Auth page.
- The authn rate limiter (`core/security/rate-limit.ts`) is registered with `global: false` — it protects NOTHING by default. Every public endpoint that sends email or does auth work must opt in per-route via `config.rateLimit` (see `authentication.controller.ts` / `otp-controller.ts` for the `API_RATE_LIMIT_AUTHN_*` pattern).

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
