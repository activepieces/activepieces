# Synkra Chat ↔ Synkra Flow — Integration Spec

**Status:** Living document
**Last updated:** 10 October 2026
**Supersedes:** `synkra_chat_flow_integration_ecosystem_brief.md`
**Audience:** Future engineering sessions, product decisions, architecture reference

---

## 1. What this document is

This is the actionable specification for how Chat and Flow connect. It captures:

1. Decisions that are locked
2. Decisions that are still open
3. What's already built
4. What needs building
5. The consent-screen reality and how Chat handles it

The original strategic brief is superseded by this spec. This document is the
source of truth going forward.

---

## 2. Locked decisions

These are decided. Build against them.

### 2.1 Flow owns all third-party credentials

Every OAuth token, API key, refresh token, and session credential for every
connected integration lives in Flow's database, encrypted by Flow's
`encryptUtils`, scoped to a Flow workspace.

This is true regardless of whether the connection was initiated from Flow or
from Chat.

**Why this is right:**

- The OAuth consent screen shown to the user says: **"Synkra Flow wants to
  access your [Provider] account"**
- Not "Synkra Chat wants to access..."
- This is unavoidable if Flow is the shared connector foundation
- Therefore Chat never sees, stores, or transmits raw provider credentials

**Consequence for Chat UX:**

When a Chat user connects an integration, they see the Flow name on the
consent screen. Chat must prepare users for this. See §4 below.

### 2.2 Chat owns the entire billing and credit relationship

- The Chat customer pays Chat.
- The Chat plan holds every credit pool:
  - AI credits
  - SMS credits
  - WhatsApp credits
  - Voice minutes
  - Email credits
  - Storage
- When a Chat user triggers a Flow-powered automation, **the credits consumed
  come from the Chat plan's pools.**
- Flow never bills a Chat user separately for Chat-included capabilities.
- A Chat customer is not automatically a Flow customer.
- Flow plans and Chat plans remain separate products.

**Consequence for metering:**

Flow's existing `synkraUsageService` meters against the `synkra_subscription`
table for the platform owner. When Chat triggers a Flow action, the meter
must deduct from the Chat customer's pool, not from a Flow pool.

This requires a billing bridge. See §6.4.

### 2.3 Product responsibilities

| Product | Owns |
|---------|------|
| **Chat** | Conversations, inbox, agent experience, support workflows, native integration catalogue, Chat billing, Chat credits |
| **Flow** | Reusable connectors, workflow engine, multi-step orchestration, credential vault, execution logs |
| **Shared** | Connector logic, credential management primitives, metering primitives, integration testing |

### 2.4 Chat users do not need a Flow account

- A Chat customer uses the integrations included in their Chat plan without
  ever visiting `flow.synkra.co.za`.
- Chat exposes only the operations relevant to support workflows, not the full
  Flow builder.
- When a customer needs multi-step, scheduled, or conditional automation
  beyond what Chat exposes, they connect to Flow explicitly (Phase 3).

### 2.5 Flow does not receive unconditional revenue from Chat

The strategic brief mentioned "preferential pricing for paid Chat subscribers"
on Flow plans. **This remains undecided.** Do not implement any discount until
pricing and margin analysis is complete.

No percentage, no eligibility rules, no renewal terms should be advertised or
built.

---

## 3. Still open — must be decided before v1

These decisions block implementation. Mark each as it's decided.

### 3.1 Chat → Flow authentication mechanism

Chat needs to invoke Flow capabilities on behalf of a Chat customer without
the customer having a Flow account.

Options considered:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. Shadow Flow account** | Each Chat customer gets an invisible Flow user + workspace, auto-created on first integration use | Uses Flow's existing auth model unchanged | Doubles user count; sync overhead; what if customer later signs up for Flow? |
| **B. Platform service token** | Chat holds one Flow service token; invokes Flow APIs with signed payloads identifying the Chat customer | Single credential; simple | All Chat traffic flows through one identity; harder to scope per-customer |
| **C. Shared workspace** | Chat and Flow share a workspace per customer; Chat calls Flow APIs with the same user identity | Cleanest long-term; enables future SSO | Requires identity unification now |

**Decision:** ___ (leave blank until decided)

**Constraint:** Whatever we pick must be **stable for v1**. It can be
replaced later, but the API contract Chat uses must not change under v1.

### 3.2 Chat → Flow API contract

Precise contract for:

- Request shape (event type, payload, customer context)
- Response shape (synchronous result vs async job id)
- Timeout policy (Chat's request timeout to Flow)
- Retry policy (idempotency keys, safe-to-retry operations)
- Failure behaviour (does Chat escalate to human? show error? queue?)

**Decision:** ___

### 3.3 Chat integration shortlist and launch order

Candidates identified. Order not yet chosen. See §7.

**Decision:** ___

### 3.4 Attribution events and reporting window

Chat must track:

- Flow discovery link shown
- Flow discovery link selected
- Flow account connected or created
- Flow subscription page viewed
- Flow subscription started
- Paid Flow subscription activated
- Flow subscription retained or cancelled

Each event needs:
- Stable customer/workspace identifier
- Timestamp
- Chat plan at time of event
- Referral identifier

**Decision:** ___ (event schema, retention window, reporting definitions)

### 3.5 SSO timing

Future. Do not block it.

**Constraint:** Do not hard-code product access around one subscription name.
Keep authentication, identity, authorisation, entitlements, and billing as
separate concerns.

---

## 4. The consent-screen reality and Chat user education

**The problem:**

When a Chat user clicks "Connect HubSpot" inside Chat, they are redirected
through Flow's OAuth flow and see:

> **Synkra Flow wants to access your HubSpot account**

Most Chat customers have never heard of Flow.

**What Chat must do:**

1. **Before the connect button** — Show a short, honest explanation:
   > "Synkra Flow is the integration engine that powers this connection.
   > You don't need a Flow account. Just click Connect and approve the
   > permissions."

2. **On the consent screen itself** — Google/Shopify/Slack show the Flow
   name because that's the registered OAuth app. This is expected.

3. **After connection** — Chat shows: "Connected via Synkra Flow" in the
   integration settings, with the ability to disconnect.

4. **If the customer ever needs more** — Contextual link: "Need a more
   advanced workflow? Build it in Synkra Flow" — but only when they hit a
   real capability boundary, never as persistent promotion.

**Design principle:** The user should never be confused about which product
they are using. The integration still feels like a Chat feature; the Flow
name appears only where the OAuth consent demands it.

---

## 5. What's already built

Everything below is live as of 10 October 2026.

### 5.1 Flow side

| Component | Status |
|-----------|--------|
| 8 custom Synkra pieces | ✅ Live: Synkra Chat, PayFast, Yoco, iKhokha, The Courier Guy, Bob Go, Uber Direct, Pargo |
| 80 visible pieces in Flow catalogue | ✅ OAuth, API Key, Custom, and utility pieces |
| 16 OAuth providers seeded | ✅ Slack, Shopify, Zoho×2, Pipedrive, ClickUp, GitHub, GitLab, Mailchimp, Square, Google×6 |
| Flow-owned credential vault | ✅ AP's `app_connection` + `oauth_app` tables |
| AI credits meter | ✅ `synkra/ai/synkra-ai-meter.ts` |
| AI credits guard (blocks chat/agents when exhausted) | ✅ |
| BYOK lockdown (Free/Starter/Business cannot bring own keys) | ✅ |
| Billing: upgrade, downgrade, cancel, reactivate, renewals | ✅ |
| Transactional emails (8 templates) | ✅ |
| Onboarding wizard | ✅ |
| Preflight page for env-var readiness | ✅ |

### 5.2 Every Chat-candidate piece from the strategic brief is already built

| Category | Pieces the brief names | Status in Flow |
|----------|----------------------|----------------|
| CRM | HubSpot, Pipedrive, Zoho CRM | ✅ All live |
| E-commerce | Shopify, WooCommerce | ✅ Both live |
| Delivery | The Courier Guy, Bob Go, Uber Direct, Pargo | ✅ All four live (custom-built) |
| Team comms | Slack | ✅ Live |
| Scheduling | Calendly, Cal.com | ✅ Both live |
| AI | OpenAI, Claude, Gemini, Groq, DeepSeek, Perplexity | ✅ All live |
| Email | SMTP, SendGrid, Postmark, Mailgun, Resend | ✅ All live |

**This means Phase 1 of the strategic brief (audit and establish foundation)
is effectively complete.**

### 5.3 What this changes

The strategic brief said "audit existing Flow connectors and identify which
can be reused by Chat". That audit is now trivially answered: **every piece
the brief named is already a Flow piece.** Chat can reuse all of them.

---

## 6. What needs building

### 6.1 Chat integrations catalogue (Chat side)

**Chat owns this UI.** Flow provides the API it consumes.

Endpoints Chat needs from Flow (to be finalised in §3.2):

GET /v1/synkra/integrations — list supported integrations for Chat
GET /v1/synkra/integrations/:id — piece details, supported operations
POST /v1/synkra/connections/start — initiate OAuth or credential setup
GET /v1/synkra/connections/:id — connection status
DEL /v1/synkra/connections/:id — disconnect
POST /v1/synkra/integrations/:id/invoke — execute a supported operation

text

Each endpoint is scoped to the Chat customer via the auth mechanism in §3.1.

### 6.2 Chat → Flow workflow invocation (Phase 3)

For advanced automations:
POST /v1/synkra/workflows/:id/trigger — trigger a named Flow workflow
GET /v1/synkra/workflow-runs/:id — poll run status

text

Request/response contract in §3.2.

### 6.3 Attribution events (Phase 4)

Chat emits events to Flow's analytics endpoint:
POST /v1/synkra/attribution/events

Event schema in §3.4.

### 6.4 Billing bridge — Chat credits consumed by Flow

**This is the hard part.**

When Chat triggers a Flow workflow that consumes AI credits, SMS, or other
metered resources, the consumption must be deducted from the **Chat plan**,
not from any Flow plan.

Flow's current meter writes to `synkra_subscription.aiOpsUsed` for the
platform owner. This assumes a Flow-owner identity.

**Two paths:**

- **(a)** Flow consults Chat's billing API before executing, gets a green
  light, then reports usage back to Chat after execution
- **(b)** Chat sends a signed billing context with each invocation; Flow
  meters locally in a separate table scoped to the Chat customer

**Decision:** ___ (sub-decision of §3.1)

**Requirement:** No unbounded Flow execution costs. Chat plan must have a
hard or soft cap on Flow-triggered resources. Free-plan Chat users cannot
burn arbitrary compute.

### 6.5 Native Chat integration UX

Chat-side components:
- Integration catalogue page
- Connect / disconnect flow
- Connection status indicator
- Operation picker for each supported integration
- Error handling (what happens if Flow is down?)
- Fallback messaging when Chat-triggered Flow execution fails

**Chat team owns this UI.** Flow provides APIs only.

---

## 7. Chat integration shortlist (from strategic brief)

| Category | Candidates | Chat use case |
|----------|-----------|---------------|
| CRM | HubSpot, Pipedrive, Zoho CRM | Find customer records, retrieve details, associate conversations with contacts |
| E-commerce | Shopify, WooCommerce | Retrieve order info for agent responses |
| Delivery | The Courier Guy, Bob Go, Uber Direct, Pargo | "Where is my order?" — retrieve real tracking status |
| Team comms | Slack | Notify teams about priority conversations |
| Scheduling | Calendly, Cal.com | Scheduling operations when relevant |
| AI | OpenAI, Claude, Gemini, Groq, DeepSeek, Perplexity | Classification, response prep, document extraction |
| Email | SMTP, SendGrid, Postmark, Mailgun | Communication operations |

**Priority order (proposed, awaiting approval in §3.3):**

1. **Delivery** — highest-value Chat use case, all 4 pieces are already live
2. **CRM** — HubSpot + Pipedrive + Zoho CRM
3. **Slack** — team notifications
4. **E-commerce** — Shopify + WooCommerce order context
5. **Scheduling** — Calendly + Cal.com
6. **AI** — providers already live, Chat uses them for support capability
7. **Email** — SMTP and others

---

## 8. Delivery use case — worked example

Concrete flow Chat will implement first.

**Scenario:** Customer asks in Chat widget: "Where is my order?"

Customer message
│
▼
Chat agent identifies intent = order status
│
▼
Chat asks for / infers order reference
│
▼
Chat calls Flow: POST /v1/synkra/integrations/courier-guy/invoke
{ operation: 'get_shipment', tracking_reference: '...' }
│
▼
Flow authenticates (via §3.1 mechanism)
Flow retrieves credentials for the Chat customer
Flow calls The Courier Guy API
Flow returns: { status: 'in_transit', last_update: '...', eta: '...' }
│
▼
Chat displays: "Your order is in transit. Last scanned [time] at [location].
Estimated delivery: [date]."
│
▼
If Flow fails or returns no tracking data:
Chat escalates to a human agent, no invented status

**Rules:**
- Chat never invents a status or ETA
- If Flow returns no tracking data, Chat escalates
- If the provider has no recent update, Chat says so honestly
- Every response is grounded in the provider's actual returned data

---

## 9. Risks and controls

| Risk | Control |
|------|---------|
| Duplicating integrations across products | Flow is the only connector implementation. Chat consumes APIs. |
| Chat becomes a second Flow builder | Advanced workflows stay in Flow. Chat invokes, not builds. |
| Chat depends on Flow uptime | Chat's inbox and conversation management must never depend on Flow. Isolate. |
| Customer confused by Flow name in OAuth | §4 education UX. |
| Uncontrolled Flow execution costs from Chat | Hard cap per Chat plan (§6.4). |
| Credential ownership ambiguity | Locked: Flow owns them (§2.1). |
| Duplicate accounts or billing confusion | Keep identity, entitlements, billing as separate concerns (§3.5). |
| Overpromising integration capabilities | Audit each piece's operations before announcing. |
| Attribution becomes intrusive | Contextual discovery only (§3.4). |

---

## 10. Guiding principles

> **Build the integration capability once. Let each Synkra product deliver
> it through a native experience. Keep the products distinct, make their
> connection valuable, and reward customers for growing within the Synkra
> ecosystem without forcing them to buy capabilities they do not need.**

Additional locked principles:

1. **Flow owns credentials. Chat owns billing.**
2. **Chat customers never need a Flow account for Chat-included features.**
3. **Chat-triggered consumption draws from Chat plan credits, never a Flow subscription.**
4. **The Flow name appears in OAuth consent. Chat educates users about it.**
5. **Chat must not be made deliberately inconvenient to force Flow adoption.**
6. **No unbounded resource costs. Every Chat plan has caps on what Flow can consume.**

---

## 11. Roadmap phases

### Phase 1 — Foundation (COMPLETE)
- ✅ 8 custom Synkra pieces built and live
- ✅ 80 visible Flow pieces
- ✅ 16 OAuth providers seeded
- ✅ Flow-owned credential vault
- ✅ Metering primitives

### Phase 2 — Chat's first native integrations
- ⏸ Decide §3.1, §3.2, §3.3
- ⏸ Build Chat integrations API in Flow
- ⏸ Build Chat integrations catalogue UI
- ⏸ Launch first 2-3 integrations (delivery + CRM proposed)
- ⏸ Consent-screen education UX

### Phase 3 — Chat ↔ Flow workflow invocation
- ⏸ Request/response contract finalized
- ⏸ Workflow selection + authorisation flow
- ⏸ Result delivery, timeouts, retries
- ⏸ Failure handling (Chat stays operational if Flow is down)

### Phase 4 — Attribution and commercial rules
- ⏸ Event schema finalized
- ⏸ Referral tracking implemented
- ⏸ Billing bridge (§6.4) implemented
- ⏸ Discount rules for Chat → Flow (if any) decided

### Phase 5 — Unified Synkra experience
- ⏸ Shared identity and workspace model
- ⏸ SSO timing decided
- ⏸ Extend foundation to future Synkra products

---

## 12. Decisions log

| Date | Decision | Rationale |
|------|----------|-----------|
| 10 Oct 2026 | Flow owns all third-party credentials | OAuth consent screen shows Flow name; Chat never touches raw credentials |
| 10 Oct 2026 | Chat owns billing and credits | Chat is the customer's commercial relationship; Flow is infrastructure |
| 10 Oct 2026 | Chat users never need a Flow account for included features | Keeps products distinct; no forced adoption |
| 10 Oct 2026 | Chat-triggered consumption comes from Chat plan | No separate Flow subscription for Chat customers |
| 10 Oct 2026 | Strategic brief superseded by this spec | Brief is a planning input; this is the actionable spec |
| _ | Chat → Flow auth mechanism | **OPEN** (§3.1) |
| _ | Chat → Flow API contract | **OPEN** (§3.2) |
| _ | Chat integration launch order | **OPEN** (§3.3) |
| _ | Attribution event schema | **OPEN** (§3.4) |
| _ | SSO timing | **OPEN** (§3.5) |

---

## 13. How to use this document

**For future engineering sessions:**

1. Read §2 (locked decisions) first — never violate these
2. Read §3 (open decisions) — check what's been decided since
3. Read §5 (what's built) — know your starting point
4. Read §6 (what to build) — this is the work queue
5. Update this doc as decisions are made — do not let it drift

**For Chat team:**

- §4 (consent UX) is mandatory
- §6.5 (Chat UI components) is Chat-side work
- §8 (delivery use case) is the recommended starting point

**For Flow team:**

- §6.1 (Chat integrations API) is Flow-side work
- §6.4 (billing bridge) is Flow-side work — the hard part
- §7 (shortlist) determines what gets built next

**For product:**

- §3 has every open decision
- §12 tracks history
- §11 shows phases

---

**End of spec. This document supersedes the strategic brief and is the source
of truth for Chat ↔ Flow.**
