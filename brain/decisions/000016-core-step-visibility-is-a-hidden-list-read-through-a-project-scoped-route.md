---
status: accepted
---

# Core step visibility is a hidden-list, read through a project-scoped route

## Decision
A piece set hides core steps (Code, Loop, Router) via `config.hiddenCoreSteps: FlowActionType[]`, resolved by the pure `isCoreStepVisible({ config, type })`. Absent and empty both mean nothing is hidden. The builder reads its own set through `GET /v1/piece-sets/current?projectId=`, a project-scoped route that returns only the `PieceSetConfig` and is registered **outside** the `managePiecesEnabled` gate, while every other `/v1/piece-sets` route stays `platformAdminOnly` inside a nested Fastify scope that owns that gate.

## Context
The first cut of Code-hiding added a `codeEnabled` boolean and let the builder read its set by widening `GET /v1/piece-sets/:id` from `platformAdminOnly` to `publicPlatform`, with the literal string `'default'` accepted in place of an id so unassigned projects could reach the Default set. It also rendered Code as a synthetic row in the admin pieces table. None of it had shipped, so the reshape cost no migration.

## Why
- A boolean per core step does not extend. The next ask (hide Loop, hide Router) would repeat the field, the resolver, the test, and the toggle. An array absorbs them.
- `PieceSelection` was the obvious thing to reuse and is the wrong shape. Its `mode` exists to pre-decide the policy for pieces that do not exist yet; core steps are a closed enum of three, so `exclude_all` has no meaning and the admin UI could never set it. Reusing it would ship a field nothing can write.
- `publicPlatform` on `/:id` let any USER or SERVICE token in the platform read any set by id, including its embed `key`. The builder needs one set, so the route should take a project, not an id.
- Overloading `'default'` as an id forced the client to duplicate the server's Default-set fallback. `pieceSetService.getForProject` now holds that fallback once, and `resolveVisibility` calls the same method.
- The gate had to match `resolveVisibility`, which checks edition only. Putting `/current` behind `managePiecesEnabled` would mean an EE platform that turns the flag off keeps hiding pieces while core steps come back — one saved set, two enforcement rules.

## Consequences
On an EE platform that turns `managePiecesEnabled` off, a saved set keeps hiding core steps with no admin UI to undo it. That is deliberate parity with pieces, which already behave that way. Making the whole set go inert would mean adding the flag check to `resolveVisibility`, which would un-hide pieces for any platform currently running with the flag off.

Hiding remains a builder-UI affordance, not a policy: `ap_add_step` still accepts `FlowActionType.CODE` and hidden piece names unchecked. Enforcement is a separate change.

A `/current` fetch that fails every retry leaves `config` undefined and every core step visible — the client **fails open**, deliberately. It reveals nothing the write path does not already accept unchecked, and the only fail-closed option is to hold the step selector in its loading state, which trades a cosmetic degradation for a builder outage where nobody can add any step at all.
