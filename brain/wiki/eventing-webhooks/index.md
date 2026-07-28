---
icon: 📨
---

# Eventing & Webhooks

Getting data in and out over HTTP, plus the internal bus that carries domain events between subsystems. Glossary below; each page holds the detail.

### 🪝 Webhook
An inbound HTTP trigger — the primary entry point for event-driven execution from outside Activepieces. **Sync** blocks the connection and returns the flow's response; **async** queues the job and returns `200` immediately with an `x-webhook-id`.
- *Avoid:* "callback" for inbound HTTP; a callback is what the engine posts to the app during a run (see [Execution Runtime](../execution-runtime/index.md)).

### 🤝 Handshake
Ownership verification a provider requires before it will send events — a challenge answered on the same route, ahead of any real payload.

### 📣 Application Event
An internal-bus domain event (27 names). The one vocabulary shared by audit logs, event destinations, and alerts — not an HTTP concept.

### 📡 Event Destination
An outbound webhook subscribing to a chosen subset of Application Events at PLATFORM or PROJECT scope, delivered via BullMQ. EE/Cloud only, gated by `auditLogEnabled`.
- *Avoid:* "event stream" — the delivery is per-destination fan-out, not a stream anyone subscribes to.

## Pages

- **Webhooks** — inbound ingest, payload normalization, sync vs async, the Redis fast path
- **Event Destinations** — outbound fan-out of Application Events
- **Flow Failure Alerts** — failure emails, Redis dedup, the 24h window
- **pubsub is the one shared Redis subscriber — reuse it** — why a second subscriber is the wrong reflex

## Related

Application Events feed Audit Events in [Authentication & Security](../authentication/index.md). Webhooks are TriggerSources that start flows in [Automation Core](../automation-core/index.md).
