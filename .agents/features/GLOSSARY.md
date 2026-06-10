# Domain Glossary — Activepieces

> Last updated: 2026-04-16

## Automation Core

| Term | Definition (one sentence) | Aliases to avoid | Related terms |
|---|---|---|---|
| Action | A single executable step within a flow that performs an operation (HTTP call, data transform, code execution, etc.). | task, command | Flow, Step, Piece |
| Agent | A flow step type that runs an LLM-driven autonomous loop, calling tools until it produces a final answer. | AI step, bot | AgentTool, AgentResult, Knowledge Base |
| AgentTool | A discriminated union of the four tool types attachable to an agent step: Piece, Flow, MCP, or Knowledge Base. | — | Agent, PredefinedInputsStructure |
| Draft | The editable FlowVersion state; only one draft exists per flow at a time. | — | FlowVersion, Published, LOCK_AND_PUBLISH |
| Flow | A named automation consisting of a trigger and one or more action steps, stored as a versioned JSONB graph. | workflow, automation, pipeline, scenario | FlowVersion, Trigger, Action, Run |
| FlowOperationRequest | The discriminated union of all 26 modification types dispatched to the single flow update endpoint. | — | Flow, FlowVersion |
| FlowRun | A single execution instance of a published flow, tracking status, logs, timing, and step results. | execution, job, run instance | Flow, FlowRunStatus, LogsFile |
| FlowRunStatus | The state machine for a run: QUEUED, RUNNING, PAUSED, SUCCEEDED, FAILED, TIMEOUT, CANCELED, and others. | — | FlowRun |
| FlowVersion | An immutable (once locked) snapshot of a flow's trigger + action graph; DRAFT is editable, LOCKED is published. | version, revision | Flow, Draft, Published |
| Folder | A grouping container for organizing flows and tables within a project. | directory, category | Flow, Table |
| Published | A LOCKED FlowVersion pointed to by `flow.publishedVersionId`; the version that runs in production. | live, active version | Draft, FlowVersion, Trigger Source |
| Sample Data | Captured step input/output stored as File entities per flow version, used for testing downstream steps. | test data, mock data | FlowVersion, Step Run |
| Step | Generic term for any node in a flow graph — either a trigger or an action. | node, block | Action, Trigger |
| Trigger | The entry point of a flow that initiates execution via webhook, polling, app event, or manual invocation. | event source, starter | TriggerStrategy, TriggerSource |
| TriggerSource | The external registration (webhook URL, polling job, app-event subscription) that fires a flow. | — | Trigger, TriggerStrategy |
| TriggerStrategy | The mechanism a trigger uses: POLLING, WEBHOOK, APP_WEBHOOK, or MANUAL. | trigger type | TriggerSource |

## Data & Storage

| Term | Definition (one sentence) | Aliases to avoid | Related terms |
|---|---|---|---|
| Cell | A single value at the intersection of a Record and a Field in a Table. | — | Record, Field, Table |
| Field | A column definition in a Table with a name and type (TEXT, NUMBER, DATE, STATIC_DROPDOWN). | column | Table, Cell, FieldType |
| File | A stored blob (S3 or DB) with type classification, optional compression, and expiry. | attachment, blob | LogsFile, Sample Data |
| Knowledge Base | A document store for AI agents that chunks files into vector-embedded segments for semantic search. | RAG store, document index | Agent, AgentKnowledgeBaseTool |
| Record | A single row in a Table, composed of Cells keyed by Field. | row, entry | Table, Cell, TableWebhook |
| Store Entry | A key-value pair scoped to a project, used by pieces to persist state across flow runs. | kv store, project store | — |
| Table | A built-in structured data store within a project, with fields, records, and automation triggers. | database, spreadsheet | Field, Record, Cell, TableWebhook |
| TableWebhook | A registration linking table events (record created/updated/deleted) to a flow for automation. | table trigger | Table, Record, Trigger |

## Pieces & Integrations

| Term | Definition (one sentence) | Aliases to avoid | Related terms |
|---|---|---|---|
| App Connection | A stored set of credentials (OAuth2, API key, basic auth, etc.) used by pieces to authenticate with external services. | credential, auth, integration key | Piece, Connection Type, Global Connection |
| Connection Type | The authentication strategy for a connection: OAUTH2, CLOUD_OAUTH2, PLATFORM_OAUTH2, SECRET_TEXT, BASIC_AUTH, CUSTOM_AUTH, NO_AUTH. | auth type | App Connection |
| externalId | A stable UUID used to cross-reference flows or connections across imports, templates, and environments. | — | Flow, App Connection, Project Release |
| Global Connection | A platform-scoped App Connection shared across all projects (scope = PLATFORM). | shared connection | App Connection, Platform |
| OAuth App | Custom OAuth2 client credentials registered per piece to override Activepieces defaults. | — | App Connection, Piece |
| Piece | A packaged integration (npm package) that provides triggers and actions for a specific service or capability. | connector, plugin, integration, app | Action, Trigger, Piece Metadata |
| Piece Metadata | The registry entry for an installed piece — name, version, auth schema, available actions/triggers. | — | Piece |

## Platform & Multi-tenancy

| Term | Definition (one sentence) | Aliases to avoid | Related terms |
|---|---|---|---|
| API Key | A platform-scoped authentication token (hashed, `sk-` prefixed) for programmatic API access. | service key, token | Platform |
| Custom Domain | A white-label domain mapped to a platform, verified via DNS (CNAME/TXT) with PENDING/ACTIVE lifecycle. | — | Platform, Appearance |
| Edition | The product variant: Community (CE, open-source), Enterprise (EE, self-hosted licensed), or Cloud (hosted SaaS). | plan type, tier | Platform, PlatformPlan |
| License Key | An activation key for self-hosted Enterprise that maps features to PlatformPlan flags with expiration tracking. | — | PlatformPlan, Edition |
| Platform | The top-level tenant entity that owns projects, users, billing, branding, and feature configuration. | tenant, organization, workspace | Project, PlatformPlan, User |
| PlatformPlan | The 40+ column entity controlling feature flags, quotas, billing state, and AI credit configuration per platform. | plan, subscription | Platform, License Key |
| PlatformRole | A user's role within a platform: ADMIN (full control), MEMBER (own projects), or OPERATOR (all projects except others' personal). | — | User, Platform |
| Project | A workspace within a platform that contains flows, tables, connections, and members. | workspace, environment | Platform, Flow, Table, ProjectMember |
| ProjectMember | An association between a user and a project with an assigned role for RBAC enforcement. | team member, collaborator | Project, ProjectRole |
| ProjectRole | A set of permissions (26 total) assigned to project members — 3 defaults (ADMIN/EDITOR/VIEWER) plus custom roles. | — | ProjectMember, Permission, RBAC |
| Signing Key | An RSA-4096 key pair used to sign/verify JWTs for the embedded authentication (Managed Auth) flow. | — | Managed Auth, Platform |

## Authentication & Security

| Term | Definition (one sentence) | Aliases to avoid | Related terms |
|---|---|---|---|
| Audit Event | A persisted record of a security-relevant action (19 event types) for compliance and forensic review. | audit log entry | ApplicationEventName |
| Federated Auth | Authentication via external identity providers (Google, GitHub) using OAuth2 code exchange. | social login, SSO | SAML, Platform |
| Managed Auth | JWT-based authentication for embedded Activepieces — exchanges an external token for an AP session with auto-provisioned user/project. | embedded auth, external token | Signing Key, Platform |
| OTP | A one-time password (10-min expiry) used for email verification and password reset flows. | verification code | UserIdentity |
| RBAC | Role-Based Access Control — enforcement of permissions based on a user's ProjectRole within a project. | authorization, ACL | ProjectRole, Permission |
| SAML | Enterprise SSO via SAML 2.0 protocol — login request, IdP redirect, ACS callback, assertion parsing. | — | Federated Auth, SSO |
| SCIM | SCIM 2.0 provisioning protocol that syncs users and groups from an IdP (Okta, etc.) to platform users and projects. | user provisioning, directory sync | Platform, User, Project |
| Secret Manager | An external vault integration (AWS Secrets Manager, HashiCorp Vault, CyberArk Conjur, 1Password) for storing connection secrets outside Activepieces. | vault, credential store | App Connection |
| UserIdentity | The authentication identity record (email, password hash, provider, verified flag) — one identity can map to users across multiple platforms. | account, identity | User, tokenVersion |
| tokenVersion | An incrementing counter on UserIdentity; bumping it invalidates all existing JWT sessions for that identity. | — | UserIdentity, Session |

## AI & Intelligence

| Term | Definition (one sentence) | Aliases to avoid | Related terms |
|---|---|---|---|
| AI Credits | A metered currency (1000 credits = $1 USD) for AI usage, backed by OpenRouter API key limits. | tokens, AI quota | PlatformPlan, OpenRouter |
| AI Provider | A configured LLM backend (OpenAI, Anthropic, Google, Azure, OpenRouter, Cloudflare, Custom, Activepieces) with encrypted credentials. | model provider, LLM config | AI Credits, Agent |
| Platform Copilot | A RAG-powered assistant that helps build flows by searching indexed code chunks and streaming AI responses. | AI assistant, flow builder AI | AI Provider |

## Eventing & Webhooks

| Term | Definition (one sentence) | Aliases to avoid | Related terms |
|---|---|---|---|
| Application Event | A domain event emitted on the internal event bus (19 types) for audit logging, badges, and event destinations. | domain event, system event | Audit Event, Event Destination |
| Event Destination | A webhook endpoint that receives real-time platform or project events, delivered via BullMQ job queue. | webhook destination, event stream | Application Event |
| Handshake | A verification protocol where external services confirm webhook ownership before sending events. | webhook verification | Webhook |
| Webhook | An HTTP endpoint that ingests external payloads to trigger flow execution, supporting sync and async modes. | callback, hook | Flow, Trigger, Handshake |

## Releases & Environments

| Term | Definition (one sentence) | Aliases to avoid | Related terms |
|---|---|---|---|
| Git Sync | Bidirectional synchronization of published flows and tables with a Git repository branch. | version control, git integration | Project Release |
| Project Release | A serialized snapshot of project state (flows, tables, connections) that can be imported/exported for environment promotion. | deployment, snapshot | Git Sync, externalId |
| Release Plan | A computed diff showing what would change if a release were applied — used for review before committing. | sync plan, diff | Project Release |

## Infrastructure

| Term | Definition (one sentence) | Aliases to avoid | Related terms |
|---|---|---|---|
| Alert | An email notification sent when a flow fails, with Redis-based deduplication (24-hour window per flow version). | notification | Flow, FlowRun |
| Badge | A gamification award (9 types) given to users for milestones like first build, webhook usage, or AI piece adoption. | achievement, reward | User |
| MCP Server | A per-project Model Context Protocol endpoint that exposes Activepieces tools to AI clients (Claude Desktop, Cursor, etc.). | — | MCP, Agent |
| Template | A reusable flow blueprint (official, custom, or shared) that can be imported to create new flows with pre-configured steps. | recipe, preset, starter | Flow |
| User Invitation | A JWT-linked invitation to join a platform or project, auto-accepted for existing users on project invites. | invite | User, ProjectMember |
