# Product Docs

Activepieces' user-facing product documentation, organized for agents — what's documented and where.

Source lives in the repo at `docs/` as Mintlify `.mdx` (nav in `docs/docs.json`), published to the public docs site. This is the product/user surface, not the engineering internals under the Engineering area. Each child page below summarizes one doc section; open it for the key facts, then go to the mdx for full detail.

## Sections
- **Self-Hosting & Install** — deploy Community Edition (Docker, Docker Compose, Helm, 1-click hosts), the recommended production shape, operations, limits, and runtime architecture.
- **Admin Guide** — the Platform Admin panel: projects, pieces, users, roles/RBAC, SSO, SCIM, secret managers, AI providers, audit logs, security.
- **Embedding** — embed the builder iframe in your SaaS: JWT provisioning, the embed SDK, connections, and MCP embedding.
- **API & Endpoints** — the REST API: Bearer key auth, seek pagination, and the CRUD endpoints for projects, users, flows, runs, connections, and more.
- **Building Pieces** — author custom pieces in TypeScript: definition, auth, actions, triggers, the piece reference, and how to share/publish.
- **Flows (User Guide)** — the no-code builder concepts: triggers and actions, passing data between steps, formulas, publishing, debugging, versioning.
- **MCP (User Guide)** — the built-in MCP server that lets AI assistants build flows and manage tables over natural language; setup and tool catalog.
- **Engineering Handbook & Playbooks** — the public company handbook: how the team works, hiring, support, engineering onboarding, playbooks, postmortems.

## Not covered here
- Editions/pricing and the `overview/welcome` marketing intro live on activepieces.com.
- Internal architecture and decisions live under the **Engineering** area, not here.
