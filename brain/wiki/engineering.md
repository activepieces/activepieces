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
- 🧠 **Decisions** are filed under the Area they touch — they hold *why* a hard-to-reverse call was made, and the alternatives rejected. Read them before you change how a subsystem works.
- 🛠️ **Skills** are separate reusable procedures — *how* to run a repeatable task.
- **Vocabulary** lives inline on the Area pages — especially Execution Runtime. One term, one meaning; match it.
