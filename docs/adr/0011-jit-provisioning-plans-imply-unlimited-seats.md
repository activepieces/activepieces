# Plans that enable JIT provisioning (embedding / SCIM / SSO) must grant unlimited seats

Status: accepted (extends ADR-0010, resolves its "SCIM/managed-authn out of scope" consequence)

## Context

Seat limits (`usersLimit`) are enforced only on the two writers ADR-0009/0010 cover: invite creation
and INACTIVE→ACTIVE reactivation, both under the `platform_plan` row lock. Every **just-in-time (JIT)
auto-provisioning** path that creates an ACTIVE, seat-consuming User does so with **no**
`checkUsersExceededLimit` call:

- **SCIM** — `scim-user-service.ts` → `getOrCreateWithProject` (gated by `plan.scimEnabled`).
- **Managed-authn / embedding** — `managed-authn-service.ts` → `userService.create` (gated by `plan.embeddingEnabled`).
- **Federated SSO sign-in for an already-existing identity** — `authentication.service.ts`
  (`federatedAuthn` → `getOrCreateWithProject`, gated by `plan.ssoEnabled` + domain checks).

Gating each of these at the point of user creation is possible (route them all through a seat check in
`getOrCreateWithProject`'s creating transaction) but undesirable: these paths are machine-driven identity
sync and SSO login, where hard-blocking the Nth user with a 402 breaks provisioning/login rather than
prompting an admin, and the whole point of embedding/SCIM is programmatic, high-volume user onboarding.

## Decision

**Do not seat-gate the JIT paths. Instead, guarantee at the plan-catalog level that any plan enabling a
JIT feature also grants unlimited users.** Concretely: every Autumn plan with `embeddingEnabled`,
`scimEnabled`, or `ssoEnabled` MUST project `usersLimit = null` (unlimited).

This makes the gap a non-issue rather than a bug: `checkUsersExceededLimit` already early-returns when
`usersLimit` is nil, so on these plans there is no finite ceiling for the JIT paths to overshoot. The
invariant lives in the plan definitions (Autumn), not in the provisioning code.

**This holds only as long as the invariant holds.** If any plan is ever shipped that enables
embedding, SCIM, or SSO *and* carries a finite `usersLimit`, this decision is void and the point must be
re-decided — the choice then is to seat-gate the JIT paths (block or soft-allow-and-bill) or to accept
unbilled overshoot on that plan. Treat a finite-seat + JIT-feature plan as a catalog error until that
re-decision happens.

## Consequences

- The seat limit is a real ceiling **only** on plans where users are metered (invite + reactivation paths,
  per ADR-0009/0010). On JIT-enabled plans, seats are uncounted by design because they are unlimited.
- **The invariant is a manual catalog guarantee, not code-enforced.** Nothing in AP currently asserts that
  a plan with `scimEnabled`/`embeddingEnabled`/`ssoEnabled` also has `usersLimit = null`. A guardrail
  (a startup/CI assertion over the plan projection, or an Autumn catalog lint) would make the invariant
  self-checking; until then it depends on how plans are authored in Autumn.
- If the product ever wants a *seat-limited* embedding/SCIM/SSO tier, that is the trigger to reopen this
  ADR and add the per-path seat gate that was deliberately not built here.
- Billing is never overcharged regardless: Autumn is metered on ACTIVE Users via a separate ACTIVE-only
  query (`billing-usage-report-service.ts`), independent of `usersLimit` enforcement.
