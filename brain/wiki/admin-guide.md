---
icon: 🛠️
---

# Admin Guide

The Platform Admin panel: how a team controls users, integrations, security, and internal automation on their instance. Most features here are Platform/Enterprise edition. Source: `docs/admin-guide/`.

## What Platform Admin does
Custom branding, project management, piece management (which pieces are available, custom/internal pieces), user management and invitations, AI provider config, and SSO/security.

## Guides
- **Structure projects** — Projects are the unit of organization; each holds its own flows, connections, and tables. Two kinds: Personal projects (private, one per invited user) and Team projects (shared collaboration spaces).
- **Manage pieces** — control which integration pieces are available.
- **SSO** — authenticate via your identity provider (Google, GitHub, Okta, JumpCloud). Can enforce by email domain and disable email/password login. Configure at Platform Settings → SSO.
- **SCIM** — user provisioning; providers documented: Okta, Microsoft Entra ID.
- **Manage OAuth2** — replace the built-in OAuth2 apps with your own credentials.
- **Setup AI providers** — configure OpenAI, Anthropic, etc. for use in flows.
- **Secret managers** — back connections with an external vault: AWS, HashiCorp Vault, CyberArk Conjur, 1Password.
- **Permissions / roles** — RBAC. Four default roles (Admin, Editor, Operator, Viewer) with graded permissions across Flows, Runs, Connections, Team, and Git Sync; custom roles supported.
- Also: event streaming, project releases, project replace CLI, manage concurrency.

## Security
- **Practices** — instance security guidance.
- **Audit logs** — a record per event: flow created/updated/deleted/published/activated/deactivated, connection upserted/deleted, flow run started/finished, folder created/updated/deleted, user signed in/up, email verified, password reset, signing key created.
