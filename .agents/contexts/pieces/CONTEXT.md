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
