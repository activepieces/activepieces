# Pieces & Integrations

How Activepieces talks to external services: the packaged integrations (pieces) and the stored credentials that authenticate them.

## Language

**Piece**:
A packaged integration (npm package) that provides triggers and actions for a specific service or capability.
_Avoid_: connector, plugin, integration, app

**Piece Metadata**:
The registry entry for an installed piece — name, version, auth schema, available actions/triggers.

**App Connection**:
A stored set of credentials (OAuth2, API key, basic auth, etc.) used by pieces to authenticate with external services.
_Avoid_: credential, auth, integration key

**Connection Type**:
The authentication strategy for a connection: OAUTH2, CLOUD_OAUTH2, PLATFORM_OAUTH2, SECRET_TEXT, BASIC_AUTH, CUSTOM_AUTH, NO_AUTH.
_Avoid_: auth type

**Global Connection**:
A platform-scoped App Connection shared across all projects (scope = PLATFORM).
_Avoid_: shared connection

**OAuth App**:
Custom OAuth2 client credentials registered per piece to override Activepieces defaults.

**externalId**:
A stable UUID used to cross-reference flows or connections across imports, templates, and environments.

**Piece Set**:
A named, reusable visibility configuration (an include/exclude selection of pieces plus per-piece action/trigger allow-lists) that a platform admin assigns to many projects. Gated by `platform.plan.managePiecesEnabled`.
_Avoid_: piece filter, allowed pieces list

**Default Set**:
The single per-platform Piece Set (`isDefault: true`, `externalId: 'default'`) that projects without an explicit assignment resolve to. Cannot be deleted; projects cannot be removed from it (they reassign to it).

**Piece Selection**:
The piece-level rule inside a Piece Set: a `mode` (`include_all` = everything incl. future minus exceptions; `exclude_all` = only the exceptions) and an `exceptions` list. `include_all` is the "auto-include new pieces" policy.
_Avoid_: disabledPieces, includeNewPieces, curatedPieces (all retired)

**Component**:
An action or a trigger belonging to a piece — the umbrella term when a distinction between the two doesn't matter. Carried in code as `componentType: 'action' | 'trigger'` plus a `componentName`. Used by the MCP flow-building tools (`lookupPieceComponent`, `validatePieceComponent`, `diagnosePieceProps`) and the piece action/trigger visibility feature (`isComponentVisible`, `ComponentIntent`).
_Avoid_: step, node, capability

**Selected components**:
A per-piece allow-list of visible actions/triggers (`selectedActions`/`selectedTriggers`). A piece with an entry is "curated" — only listed components are visible and new ones stay hidden; a piece with no entry shows all components including future ones.
_Avoid_: disabledActions, disabledTriggers
