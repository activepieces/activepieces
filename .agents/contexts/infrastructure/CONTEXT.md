# Platform Services

Cross-cutting product services that sit beside the core automation: failure alerts, gamification, MCP exposure, templates, and invitations. (Execution-runtime terms — Worker, Sandbox, Runtime — live in the separate Execution Runtime / Sandbox Pool / Worker Runtime contexts, see CONTEXT-MAP.md.)

## Language

**Alert**:
An email notification sent when a flow fails, with Redis-based deduplication (24-hour window per flow version).
_Avoid_: notification

**MCP Server**:
A per-project Model Context Protocol endpoint that exposes Activepieces tools to AI clients (Claude Desktop, Cursor, etc.).

**Template**:
A reusable flow blueprint (official, custom, or shared) that can be imported to create new flows with pre-configured steps.
_Avoid_: recipe, preset, starter

**User Invitation**:
A JWT-linked invitation to join a platform or project, auto-accepted for existing users on project invites.
_Avoid_: invite

**Badge**:
A gamification award (9 types) given to users for milestones like first build, webhook usage, or AI piece adoption.
_Avoid_: achievement, reward
