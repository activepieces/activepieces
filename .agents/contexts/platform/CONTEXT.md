# Platform & Multi-tenancy

The tenancy hierarchy and its governance: Platform → Project → User, plus the plans, roles, and keys that gate access and features.

## Language

**Platform**:
The top-level tenant entity that owns projects, users, billing, branding, and feature configuration.
_Avoid_: tenant, organization, workspace

**Project**:
A workspace within a platform that contains flows, tables, connections, and members.
_Avoid_: workspace, environment

**PlatformPlan**:
The 40+ column entity controlling feature flags, quotas, billing state, and AI credit configuration per platform.
_Avoid_: plan, subscription

**Edition**:
The product variant: Community (CE, open-source), Enterprise (EE, self-hosted licensed), or Cloud (hosted SaaS).
_Avoid_: plan type, tier

**License Key**:
An activation key for self-hosted Enterprise that maps features to PlatformPlan flags with expiration tracking.

**PlatformRole**:
A user's role within a platform: ADMIN (full control), MEMBER (own projects), or OPERATOR (all projects except others' personal).

**ProjectMember**:
An association between a user and a project with an assigned role for RBAC enforcement.
_Avoid_: team member, collaborator

**ProjectRole**:
A set of permissions (26 total) assigned to project members — 3 defaults (ADMIN/EDITOR/VIEWER) plus custom roles.

**API Key**:
A platform-scoped authentication token (hashed, `sk-` prefixed) for programmatic API access.
_Avoid_: service key, token

**Custom Domain**:
A white-label domain mapped to a platform, verified via DNS (CNAME/TXT) with PENDING/ACTIVE lifecycle.

**Signing Key**:
An RSA-4096 key pair used to sign/verify JWTs for the embedded authentication (Managed Auth) flow.
