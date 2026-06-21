# Pieces & Connections

Pieces are the packaged integrations that give flows their actions and triggers; connections are the stored credentials those pieces authenticate with. This context owns the vocabulary of both.

## Language

**Piece**:
A packaged integration (npm package) that provides triggers and actions for a specific service or capability.
_Avoid_: connector, plugin, integration, app

**Piece Metadata**:
The registry entry for an installed piece — name, version, auth schema, and available actions/triggers.

**App Connection**:
A stored set of credentials (OAuth2, API key, basic auth, etc.) used by pieces to authenticate with external services.
_Avoid_: credential, auth, integration key

**Connection Type**:
The authentication strategy for a connection: OAUTH2, CLOUD_OAUTH2, PLATFORM_OAUTH2, SECRET_TEXT, BASIC_AUTH, CUSTOM_AUTH, or NO_AUTH.
_Avoid_: auth type

**Global Connection**:
A platform-scoped `App Connection` shared across all projects (scope = PLATFORM).
_Avoid_: shared connection

**OAuth App**:
Custom OAuth2 client credentials registered per piece to override the Activepieces defaults.

**Secret Manager**:
An external vault integration (AWS Secrets Manager, HashiCorp Vault, CyberArk Conjur, 1Password) for storing connection secrets outside Activepieces.
_Avoid_: vault, credential store

**externalId**:
A stable UUID used to cross-reference flows or connections across imports, templates, and environments.
