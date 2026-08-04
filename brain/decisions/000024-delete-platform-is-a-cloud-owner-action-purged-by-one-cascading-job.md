---
status: accepted
---

# Delete Platform is a Cloud, owner-only action purged by one cascading job

## Decision

The account-settings "Delete Your Account" control becomes **Delete Platform** and moves to **Platform Admin**, where the rest of the platform-wide destructive surface lives. It is confirmed by typing the **platform name**, not the owner's email, and it targets the **currently-active platform** — a Cloud owner's other platforms are untouched. It stays **Cloud-only** and **owner-only** (the existing `platformToEditMustBeOwnedByCurrentUser` check on `DELETE /v1/platforms/:id`).

The `isCloudNonEnterprisePlan` plan gate is replaced by a **subscription** gate: a platform with a live subscription is refused with "cancel your subscription first". Once there is no active subscription, any Cloud platform owner may delete — enterprise included. Activepieces **never touches Stripe** during teardown; the customer and its billing history are deliberately left intact, so `stripeHelper.deleteCustomer` drops out of the flow — already removed from the endpoint on `feat/autumn-billing-integration`, which this builds on.

Teardown is two-beat. **Access is cut when the request returns**: every member's `user` row goes `INACTIVE`, which is what actually stops logins and flow runs — the `platform` row itself is left untouched and gains no soft-delete column. The owner gets a confirmation email; other members get nothing and simply lose access. The data is then **purged ~7 days later** by a **single** `HARD_DELETE_PLATFORM` job, scheduled as a one-time BullMQ job with a 7-day delay. That one job kills the out-of-Postgres side effects (BullMQ schedules, webhooks, queued work), deletes the tables that no foreign key reaches, deletes the `platform` row — letting the FK cascade clear the rest — and only then deletes the `user` rows and any `user_identity` no surviving user references. Scope is **Postgres only**: S3 objects, ClickHouse run logs, and Cloudflare DNS for custom domains and embed subdomains are out of scope for v1. If the job exhausts its attempts it fails like any other system job; no bespoke alerting.

## Context

The button shipped as an account-deletion affordance for Cloud freemium, but it was always a platform delete wearing the wrong label — and it does not work. Reading the schema rather than the entity files is what makes the real failure visible.

**A `platformId` column is not a foreign key.** 32 entities carry the column; only **18 FKs** actually reference `platform(id)`. Of those, 14 already `CASCADE`. Exactly **four block the delete**: `project` and `signing_key` are `RESTRICT`, `tag` and `piece_tag` are `NO ACTION`. So teardown fails for any tenant with a signing key or a piece tag — not, as the code reads, for any tenant with a second member. **Nine tables carry `platformId` with no FK at all** (`user`, `file`, `app_connection`, `piece_metadata`, `project_role`, `project_member`, `user_invitation`, `mcp_oauth_token`, `mcp_oauth_authorization_code`); they neither block nor follow, they orphan.

The endpoint compounds this by deactivating only the *invoking* user, leaving every other member with a working login into a tenant on its way out. And the platform job waits on `remainingProjects === 0` counted `withDeleted()`, polling behind the per-project `HARD_DELETE_PROJECT` jobs on a 25×60s budget. When it runs out, the platform is left half-dead — owner deactivated, projects gone, Stripe customer already deleted, platform row still present — and nobody is told.

## Why

- **DB-level `ON DELETE CASCADE` over explicit ordered deletes in the job.** Enumerating tables in dependency order is a list someone maintains by hand forever; the first `platformId` table that ships without a new line silently leaks rows or blocks the delete. Cascade makes correctness the schema's job. A CI guard failing on a new `platformId` FK without `ON DELETE CASCADE` was considered and not taken — the convention stands on review for now.
- **One teardown job over per-project chaining.** The two-phase design buys nothing once the schema cascades, and its failure mode is the bug above: two independent 25-attempt budgets racing, with a half-deleted tenant when they lose.
- **No soft-delete column on `platform`.** Deactivating the members already cuts access, and every auth guard and platform resolver in the app would otherwise need to learn about a new deleted state. Fewer read paths to get wrong.
- **Block on an active subscription rather than cancel it.** Cancelling someone's subscription as a side effect of a delete is a billing action on their behalf; a pre-step keeps the money decision explicit and separately auditable.
- **Keep the Stripe customer.** Billing history and invoices outlive the tenant for finance and dispute handling. Deleting the customer — what the code does today — destroys that record for no operational gain.
- **Cloud only.** CE installs are single-platform, so the control is a self-destruct button with no second tenant to return to; self-hosters tear down by dropping the database. EE was considered and deferred until a multi-platform EE install asks.
- **~7 days between cut-off and purge.** Access ends immediately, so the window costs the owner nothing, and it leaves room to catch a mistaken delete or a stuck teardown while the rows are still in Postgres.

## Consequences

The 7-day window is **reversible in practice but never offered as reversible**. The rows are still there, so support can restore a platform inside it; the owner sees "This action is irreversible" and gets no undo path. Do not let that support capability leak into product copy — the moment it reads as a soft delete, people click it to try it out.

**Delete order is forced by the schema, not by taste.** `platform.ownerId → user` is `RESTRICT` and `project.ownerId → user` is `NO ACTION`, so the platform row must go before its owner's `user` row and projects before any user. There is one more trap: `piece_metadata.archiveId → file` is `RESTRICT`, and `file.projectId → project` is `CASCADE` — so a custom piece archive blocks the file delete that the project cascade triggers. `piece_metadata` has to go before files.

The nine unconstrained tables need explicit deletes in the job. `project_member` is already reachable (it cascades from both `project` and `user`), and `file` and `user_invitation` are covered for their project-scoped rows only — platform assets (logos, favicons) and platform-scoped invitations are not. Everything else on that list is invisible to the cascade.

Every new entity carrying `platformId` must ship its FK with `ON DELETE CASCADE`. There is no CI enforcement, so this is a review-time obligation: miss it and platform deletion starts failing for the tenants that happen to have a row in the new table — exactly the failure being fixed here, resurfacing later and harder to spot.

A one-time BullMQ job delayed seven days is exposed for that whole week: a queue flush or Redis loss means the platform is never purged and nothing notices, leaving members deactivated forever with their data intact. A daily sweep over deactivated platforms would be the backstop; it was weighed and not taken.

Non-Postgres artifacts outlive the platform: uploaded files and platform assets in S3, run logs in ClickHouse, Cloudflare DNS for custom domains and embed subdomains. A deleted platform's embed subdomain in particular stays claimed after the tenant is gone. Accepted for v1, and the first thing to revisit if a data-deletion commitment needs to cover it.

Because teardown is one job, whatever the per-project path did for flow side effects — `flowSideEffects.preDelete`, unscheduling triggers, draining queued work — has to be done platform-wide inside it. A cascading `DELETE` reaches no BullMQ queue; rows vanishing while schedules survive is how you get triggers firing for a flow that no longer exists.

Owner and members are deleted together, but a `user_identity` shared with another platform survives. Deleting a platform must never sign someone out of an unrelated one.

## Tracking

SRE-210 — https://linear.app/activepieces/issue/SRE-210/delete-platform-pivot-the-account-delete-button-into-a-teardown-that
