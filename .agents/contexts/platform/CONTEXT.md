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

**Seat**:
A platform User slot. User-facing term for the `users`/`usersLimit` billing dimension (Autumn feature `usersLimit`). A seat is consumed by an **active** User (deactivated/`UserStatus.INACTIVE` users free it) OR **reserved** by a **non-expired invitation** (`PENDING`, or `ACCEPTED` but not yet provisioned into a User) to a not-yet-existing platform user (GitHub model — reserved at invite time, not at accept). The two are mutually exclusive: once the invitation is provisioned into a User the invite stops counting and the User counts instead. `usedSeats = active Users + distinct reserved invites`; `usersLimit` = the plan's base allotment plus any purchased extra seats. See ADR-0010.
_Avoid_: license, user license (in billing UI); use "seat".

**Top-up**:
A purchase that raises a billable quantity beyond the plan's base allotment. Two kinds, split by feature type: a **consumable** top-up (AI Credits) is additive one-time balance; an **unconsumable** top-up (Seats, later Projects) is a recurring prepaid add-on set to a target total quantity — increases apply immediately (prorated), decreases schedule at period end.
_Avoid_: add-on (ambiguous), upgrade (that is a plan switch).

**Active-user floor**:
The rule that a seat-lowering action — a **plan downgrade** or a **seat decrease** — cannot set `usersLimit` below the platform's current **used seats** (active Users **plus** reserved pending invites; see Seat and ADR-0010). Enforced at request time (not at the period-end effective date). To go lower, the admin frees seats by deactivating users and/or revoking pending invites (the deactivation dialog lists both); only the **owner** is protected (admins included), so the minimum reachable seat count is 1.
_Avoid_: seat limit (that is `usersLimit` itself), overage (no seat overage exists — the floor blocks instead).

**Scheduled seat cap**:
The seat allotment of a **scheduled plan change** (paid→paid downgrade or cancel-to-Free, which apply at period end). While the schedule is pending, seat-consuming operations enforce `min(usersLimit, scheduled seat cap)`, so a platform that deactivated down to the target cannot re-inflate before the switch lands (ADR-0013). Derived from Autumn customer state by the projection sync (`scheduledUsersLimit` on PlatformPlan) — never set at initiation; lifted by reactivating the subscription ("Keep current plan") or when the switch applies. Complements the Active-user floor: the floor guards the moment a lower limit is *requested*, the cap guards the *window* until it takes effect.
_Avoid_: pending limit, future cap.
