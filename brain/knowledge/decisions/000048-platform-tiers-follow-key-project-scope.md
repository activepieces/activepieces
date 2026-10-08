---
status: proposed
---

# Platform tiers follow key project scope

## Decision
A platform tier runs in project P only the entries whose key serves P (the key's project scope) and allows the model (its model scope). The tier is available in P only when its main entry, the stored `entries[0]`, can run there; otherwise P's pickers don't list it, and a stored ref fails with "This tier isn't available in this project". Chat, agents and the agent builder also skip any entry the model catalog says can't call tools, and refuse a tier whose main model can't.

## Context
Decision 000044 let a tier grant its entries to every project, so a key limited to some projects ran everywhere once it sat in a tier. The key page still said "Only these projects can use this key", and nothing warned the admin. Product's call: per-project model scoping matters more than tiers, so tiers follow it.

## Why
One rule for every path (flow steps, agents, chat, tools, project switch) is easier to trust than a grant with exceptions. Gating on the main model keeps a tier's name honest: "Expert" means the same main model in every project that sees it. We rejected giving each tier its own project scope: that would be a second scope system that still contradicts the key's.

## Consequences
- Narrowing a key's projects can hide a tier from those projects. The admin UI shows the impact before saving.
- The project-scope check is shared in `ai-key-scope.ts` (`aiKeyScope.rowAllowsScope`), used by both `aiProviderService` and `platformModelTierService`.
- A tier conversation can switch projects only if every key the run could fall back to (the Fast tier's too) serves the new project.
- Labels for billing and analytics still read the tier's main model without a project: they hand out no credentials.
