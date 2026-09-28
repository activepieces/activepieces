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
An outbound endpoint subscribing to a chosen subset of Application Events at PLATFORM or PROJECT scope, delivered via BullMQ in its Format. EE/Cloud only, gated by `eventStreamingEnabled`. "Event Streaming" is only the name of the feature and its admin page.
- *Avoid:* "event stream", "audit stream" — the delivery is per-destination fan-out, not a stream anyone subscribes to.

### 🧾 Format
How an Event Destination encodes each Application Event on the wire: `RAW` (the event JSON), `OTLP_JSON`, or `OTLP_PROTOBUF` (an OpenTelemetry logs export request).
- *Avoid:* "mapper", "payload template", "preset", "destination type" — all retired; the encoding is part of the Format, not a separate setting.

### 🧭 Handler Flow
A flow on the same instance whose webhook URL is an Event Destination URL. It gets events internally, never over HTTP, and expects the `RAW` Format.
- *Avoid:* "internal flow".

## Pages

- **Webhooks** — inbound ingest, payload normalization, sync vs async, the Redis fast path
- **Event Destinations** — outbound fan-out of Application Events
- **Flow Failure Alerts** — failure emails, Redis dedup, the 24h window
- **pubsub is the one shared Redis subscriber — reuse it** — why a second subscriber is the wrong reflex

## Related

Application Events feed Audit Events in [Data, Storage & Observability](../data-storage-observability/index.md). Webhooks are TriggerSources that start flows in [Flows & Execution](../flows-execution/index.md).
