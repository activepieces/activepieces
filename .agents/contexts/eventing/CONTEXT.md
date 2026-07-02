# Eventing & Webhooks

The internal event bus and the inbound/outbound HTTP that connects flows to the outside world.

## Language

**Webhook**:
An HTTP endpoint that ingests external payloads to trigger flow execution, supporting sync and async modes.
_Avoid_: callback, hook

**Handshake**:
A verification protocol where external services confirm webhook ownership before sending events.
_Avoid_: webhook verification

**Application Event**:
A domain event emitted on the internal event bus (19 types) for audit logging, badges, and event destinations.
_Avoid_: domain event, system event

**Event Destination**:
A webhook endpoint that receives real-time platform or project events, delivered via BullMQ job queue.
_Avoid_: webhook destination, event stream
