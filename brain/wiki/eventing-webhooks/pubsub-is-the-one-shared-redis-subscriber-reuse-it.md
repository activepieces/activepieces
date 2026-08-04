---
icon: 📡
---

# pubsub is the one shared Redis subscriber — reuse it

`pubsub` (`packages/server/api/src/app/helper/pubsub.ts`) is the app's single shared Redis subscriber connection. Use it for all in-process fan-out over Redis pub/sub — **do not** open your own `redisConnections.create()` subscriber per wait/request (that churns connections and can hit managed-Redis client caps).

How it works (as of Jul 2026): one connection, one `on('message')` dispatcher registered at connection creation, and a `Map<channel, Set<listener>>`. `subscribe(channel, listener)` adds to the set (Redis `SUBSCRIBE` only on the first listener of a channel); `unsubscribe(channel, listener?)` removes one listener (or the whole channel if no listener passed) and Redis `UNSUBSCRIBE`s when the set empties.

Gotcha it used to have: the old `subscribe` registered a fresh `on('message')` handler every call and `unsubscribe` never removed it — a listener leak. Safe then only because every caller subscribed once at startup to a fixed channel. That's fixed now, so churny/dynamic-channel use (subscribe+unsubscribe per turn) is fine — pass the `listener` to `unsubscribe` for per-waiter cleanup. Reference caller: `chatApprovalGate.waitForDecision` in `ee/chat/chat-approval-gate.ts`.
