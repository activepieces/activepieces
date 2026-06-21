# Eventing & Delivery

The internal domain-event bus and the outbound delivery of those events: webhooks that bring events in, event destinations that send them out, and failure alerts.

## Language

**Application Event**:
A domain event emitted on the internal event bus for audit logging, badges, and event destinations.
_Avoid_: domain event, system event

**Event Destination**:
A webhook endpoint that receives real-time platform or project events, delivered via the BullMQ job queue.
_Avoid_: webhook destination, event stream

**Webhook**:
An HTTP endpoint that ingests external payloads to trigger flow execution, supporting sync and async modes.
_Avoid_: callback, hook

**Handshake**:
A verification protocol where external services confirm webhook ownership before sending events.
_Avoid_: webhook verification

**Alert**:
An email notification sent when a flow fails, with Redis-based deduplication (24-hour window per flow version).
_Avoid_: notification
