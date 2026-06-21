# Platform & Tenancy

The multi-tenant backbone: a `Platform` owns `Project`s, users, billing, branding, and feature configuration. This context also owns roles, plans, editions, and the delivery of project state across environments.

## Language

**Platform**:
The top-level tenant entity that owns projects, users, billing, branding, and feature configuration.
_Avoid_: tenant, organization, workspace

**Project**:
A workspace within a platform that contains flows, tables, connections, and members.
_Avoid_: workspace, environment

**ProjectMember**:
An association between a user and a project with an assigned role for RBAC enforcement.
_Avoid_: team member, collaborator

**ProjectRole**:
A set of permissions assigned to project members — three defaults (ADMIN/EDITOR/VIEWER) plus custom roles.

**PlatformRole**:
A user's role within a platform: ADMIN (full control), MEMBER (own projects), or OPERATOR (all projects except others' personal).

**RBAC**:
Role-Based Access Control — enforcement of permissions based on a user's `ProjectRole` within a project.
_Avoid_: authorization, ACL

**PlatformPlan**:
The entity controlling feature flags, quotas, billing state, and AI credit configuration per platform.
_Avoid_: plan, subscription

**Edition**:
The product variant: Community (CE, open-source), Enterprise (EE, self-hosted licensed), or Cloud (hosted SaaS).
_Avoid_: plan type, tier

**License Key**:
An activation key for self-hosted Enterprise that maps features to `PlatformPlan` flags with expiration tracking.

**API Key**:
A platform-scoped authentication token (hashed, `sk-` prefixed) for programmatic API access.
_Avoid_: service key, token

**Custom Domain**:
A white-label domain mapped to a platform, verified via DNS (CNAME/TXT) with PENDING/ACTIVE lifecycle.

**Signing Key**:
An RSA-4096 key pair used to sign/verify JWTs for the embedded authentication (Managed Auth) flow.

**Git Sync**:
Bidirectional synchronization of published flows and tables with a Git repository branch.
_Avoid_: version control, git integration

**Project Release**:
A serialized snapshot of project state (flows, tables, connections) that can be imported/exported for environment promotion.
_Avoid_: deployment, snapshot

**Release Plan**:
A computed diff showing what would change if a release were applied — used for review before committing.
_Avoid_: sync plan, diff

**Template**:
A reusable flow blueprint (official, custom, or shared) that can be imported to create new flows with pre-configured steps.
_Avoid_: recipe, preset, starter

**Badge**:
A gamification award given to users for milestones like first build, webhook usage, or AI piece adoption.
_Avoid_: achievement, reward
