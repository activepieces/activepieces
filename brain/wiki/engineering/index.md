---
icon: 🧭
---

# Engineering

The **Activepieces engineering brain**: how the system works, and *why* it was built that way. Read this first, then jump to an Area. Written for both people and agents — every page names its topic, front-loads the point, and stands alone.

## 🗺️ Areas

- 🏛️ [Architecture Spine](https://craftspace.app/o/activepieces/pages/pg_lf5wM8ajqA9wI85PV54uT) — the non-obvious cross-cutting rules (multi-tenancy, editions, entity registration, SSRF, package layout). Start here for "how do I not break things".
  - 🧩 [Pieces & Engine](https://craftspace.app/o/activepieces/pages/pg_EaDBCAoHuQIw6fQcc9UCf) — piece catalog, visibility, formulas, workers, AI agents.
  - 🏢 [Platform & Editions (EE)](https://craftspace.app/o/activepieces/pages/pg_3Vdh9lQJTzG9VTQFxcgDx) — Platform → Project → User, plans, CE/EE/Cloud gating.
- 🔀 [Flows & Execution](https://craftspace.app/o/activepieces/pages/pg_pjh7gNWz3aPrRAASslKT5) — how flows are authored, triggered, run, and organized.
  - ⚙️ [Execution Runtime](https://craftspace.app/o/activepieces/pages/pg_xLVaOvA8hs9XVLj7kNZNE) — where and how a job runs: Worker-is-Sandbox, Resolver, Slots, Reservations. The execution glossary.
- 🤖 [AI & MCP](https://craftspace.app/o/activepieces/pages/pg_fApFNfXCXWZr3y3cyqqg3) — AI providers, credits, copilot, exposing Activepieces as an MCP server.
- 🔐 [Connections & Auth](https://craftspace.app/o/activepieces/pages/pg_Tu9nuosfHV1MCIHXcKL1l) — login, RBAC, audit, connections, secrets.
- 💾 [Data, Storage & Observability](https://craftspace.app/o/activepieces/pages/pg_vpiOe3lf7N9ox2XhxrJyH) — Tables, Files, KV, variables, audit logs, analytics.

## 🧭 How this wiki is organized

- 📄 **Area pages** are the skim-map of a subsystem — one section per component, gotchas called out. They hold *what a thing is now*.
- ⚠️ **A gotcha is never its own page.** It belongs in the `Gotchas` section of the page for the feature it bites, so whoever reads about that feature meets it in place instead of having to already know it exists. Add a bullet there; only start a new page when the *topic* is new.
- 🧠 **Decisions** are filed under the Area they touch — they hold *why* a hard-to-reverse call was made, and the alternatives rejected. Read them before you change how a subsystem works.
- 🛠️ **A skill is an investigation; a rule is a page.** If the procedure can be written as a numbered list that is true every time, it belongs on a wiki page — the agent needs it *known*, not *executed*. It is only a skill when what you do at step 3 depends on what step 2 turned up: interrogating a live system, following evidence across ClickHouse/BullMQ/Postgres, judging per-finding reachability, capturing real output against a live connection. Note that "runs a CLI command" is **not** the test — one command plus a page of conventions is still a page. Conventions filed as skills go stale in four places at once (`CLAUDE.md`, `.claude/rules/`, Architecture Spine, and the skill) and only ever load when a description happens to match.
- **Vocabulary** lives inline on the Area pages — especially Execution Runtime. One term, one meaning; match it.

## Pages

- **Engineering Handbook & Playbooks** — how we build and ship
- **API & Endpoints** — route conventions and the security contract
- **Server Module Anatomy** — the six files of a server module (entity → migration → repo → service → controller → module), and the manual registration steps nothing auto-discovers
- **Web Feature Anatomy** — the frontend feature folder, its barrel, route guards, and when a query gets the global error dialog
- **CI PR Review Hygiene** — draft-first Greptile review, the per-area PR size gate, and the workflow conventions reviewers keep re-litigating
- **Architecture Spine** — the load-bearing structure of the codebase, and the gotchas that come with it: request-body `.max()` as data loss, TypeORM soft-delete across a canary window, and canary not proxying websockets
