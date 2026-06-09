# CE-Only Build — Review Guide

This branch (`ce-only-strip`) removes all Enterprise Edition (EE) code from the repository, producing a codebase that compiles and runs exclusively as Community Edition.

---

## Why

The goal is a clean CE distribution with:
- Zero dependency on EE licensing, billing, or feature flags
- No EE code shipped in the CE Docker image
- A smaller, auditable codebase for CE deployments

---

## What Was Removed

### Server (`packages/server/api/src/app/ee/`)
| Module | Description |
|---|---|
| `alerts/` | Flow-failure email alerts |
| `api-keys/` | API key authentication |
| `app-credentials/`, `connection-keys/` | Product-embed OAuth credentials |
| `appsumo/` | AppSumo billing integration |
| `audit-logs/` | Audit event storage and service |
| `authentication/` | OTP, SAML SSO, federated auth, RBAC middleware |
| `chat/` | AI chat conversations |
| `embed-subdomain/` | Cloudflare custom subdomain embedding |
| `flags/` | Enterprise feature-flag overrides |
| `global-connections/` | Cross-project shared connections |
| `license-keys/` | License key validation |
| `managed-authn/` | Embedded managed authentication |
| `oauth-apps/` | Platform-level OAuth app management |
| `pieces/filters/` | Plan-based piece filtering |
| `platform/admin/`, `platform-plan/`, `stripe-billing/` | Admin portal, billing plans, Stripe |
| `platform-webhooks/` | Platform-level webhook notifications |
| `projects/project-members/` | Project member management |
| `projects/project-plan/` | Per-project billing plans |
| `projects/project-release/` | Git sync and project releases |
| `projects/project-role/` | Custom RBAC roles |
| `scim/` | SCIM user provisioning |
| `secret-managers/` | AWS/HashiCorp/CyberArk secret integration |
| `signing-key/` | JWT signing keys for embedding |
| `template/` | Platform-level template management |
| `users/` | EE user management endpoints |
| `database/migrations/postgres/` | 20 EE-specific DB migrations |

### Shared types (`packages/shared/src/lib/ee/`)
All 42 EE type definitions: alerts, api-key, audit-events, authn, billing, chat, embed-subdomain, event-destinations, git-repo, managed-authn, oauth-apps, otp, product-embed, project-members, scim, secret-managers, signing-key.

### Frontend (`packages/web/src/`)
| Directory | Description |
|---|---|
| `features/billing/` | Billing UI, Stripe plans, AI credits purchase |
| `features/alerts/` | Alert subscription UI |
| `features/members/` | Project member management UI |
| `features/secret-managers/` | Secret manager configuration UI |
| `features/project-releases/` | Git sync and release UI |
| `features/chat/` | AI chat feature UI |
| `app/routes/chat-with-ai/` | AI chat conversation pages |
| `app/routes/chat/` | Flow-level chat drawer |
| `app/routes/platform/billing/` | Platform billing page |
| `app/routes/platform/security/` | API keys, audit logs, SSO, embed, project roles, secret managers |
| `app/components/project-settings/alerts/` | Alert settings panel |
| `app/components/project-settings/environment/` | Git sync environment panel |
| `app/components/project-settings/members/` | Members settings panel |
| `app/components/edition-guard.tsx` | Edition-based component gate |
| `app/components/sidebar/sidebar-usage-limits.tsx` | Cloud usage limits widget |
| `features/platform-admin/api/` | EE-only API clients (api-key, signing-key, embed-subdomain) |
| `features/authentication/components/` | OTP/reset-password/change-password auth forms |

### Packages (`packages/ee/embed-sdk/`)
The entire embed SDK package.

---

## What Was Preserved (CE)

Everything related to the core automation engine:

- **Flows** — builder, runner, triggers, webhooks
- **Connections** — app connections, OAuth2
- **Tables** — data tables product
- **Templates** — community templates
- **Pieces** — all community pieces, piece metadata
- **MCP** — model context protocol server
- **Agents** — AI agents module
- **Knowledge Base** — vector search
- **Platform admin** — project management, user management, AI providers, branding, pieces config
- **Event destinations** — webhook event streaming (CE feature)
- **Authentication** — sign-in, sign-up, email verification, invitation flow
- **Analytics** — platform analytics reports

---

## New CE Types Added to `@activepieces/shared`

Types that lived in EE modules but are needed by CE code were migrated:

| Type | Location | Purpose |
|---|---|---|
| `ApplicationEventName` | `automation/events.ts` | Event name enum (CE subset) |
| `ApplicationEvent` | `automation/events.ts` | Generic audit/event type |
| `FlowRunEvent`, `FlowUpdatedEvent` | `automation/events.ts` | Typed event aliases for badge checks |
| `EventDestination`, `EventDestinationScope` | `automation/event-destinations.ts` | CE event streaming |
| `buildMockEvent` | `automation/events.ts` | Test helper for event destinations |
| `OPEN_SOURCE_PLAN` | `management/platform/platform.model.ts` | CE plan defaults (all limits null/false) |
| `rolePermissions` | `management/project/project-member.ts` | Default CE role → Permission mapping |
| `ConnectionState` | `automation/app-connection/app-connection.ts` | Connection state for table imports |
| `FieldState` | `automation/tables/field.ts` | Field definition for table templates |

---

## Database Impact

### Entities removed
19 EE TypeORM entities are no longer registered: `AlertEntity`, `ApiKeyEntity`, `AppCredentialEntity`, `AppSumoEntity`, `AuditEventEntity`, `OtpEntity`, `ChatConversationEntity`, `ConnectionKeyEntity`, `EmbedSubdomainEntity`, `OAuthAppEntity`, `ConcurrencyPoolEntity`, `PlatformPlanEntity`, `ProjectMemberEntity`, `ProjectPlanEntity`, `GitRepoEntity`, `ProjectReleaseEntity`, `ProjectRoleEntity` (moved to CE), `SecretManagerEntity`, `SigningKeyEntity`.

### Migrations removed
20 old EE migrations (pre-unification) are no longer loaded. The tables they created still exist in any existing EE database — this branch is intended for fresh CE installations only.

### `ProjectRoleEntity` moved to CE
`packages/server/api/src/app/project/project-role.entity.ts` — CE still seeds default roles (Admin, Editor, Viewer) via `role-seed.ts` using the CE `rolePermissions` map.

---

## Architecture Changes

### `app.ts` — edition switch removed
The `CLOUD / ENTERPRISE / COMMUNITY` switch block is gone. The server always registers CE modules only. The `communityPiecesModule` is always active.

### RBAC removed
The `rbacMiddleware` Fastify hook is removed. In CE all authenticated users have full access within their project — no role checks.

### Email / SMTP removed
`emailService` and `smtpEmailSender` are removed. Invitation emails are no-ops in CE. Users are auto-verified on sign-up.

### Secret managers bypassed
App connections read secrets directly from the encrypted database column. No external vault lookup.

### Worker chat agent stubbed
`WorkerJobType.EXECUTE_CHAT_AGENT` is kept in the enum (used by the MCP/agent system) but its handler throws `"not supported in Community Edition"`.

---

## Type-Check Results

```
packages/shared          tsc -p tsconfig.lib.json      ✅  0 errors
packages/web             tsc --noEmit -p tsconfig.app.json  ✅  0 errors
packages/server/api      tsc --noEmit -p tsconfig.app.json  ⚠️  14 errors (pre-existing*)
```

\* Pre-existing strict-mode issues in CE files unrelated to this PR:
- `response.json()` returns `unknown` in 3 CE service files (`system-props.ts`, `piece-sync-service.ts`, `community-templates.service.ts`)
- 4 community piece packages (`piece-facebook-leads`, `piece-intercom`, `piece-slack`, `piece-square`) not bundled locally

---

## How to Test

```bash
# Install dependencies
bun install

# Type-check shared
cd packages/shared && bun run build

# Type-check server
cd packages/server/api && npx tsc -p tsconfig.app.json --noEmit

# Type-check web
cd packages/web && npx tsc --noEmit -p tsconfig.app.json

# Run the server (CE mode)
AP_EDITION=COMMUNITY bun run serve:backend

# Run the frontend
bun run serve:frontend
```
