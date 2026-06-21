# Concurrent operations use explicit cross-server coordination

Activepieces runs as multiple server and worker processes against shared Postgres and Redis, so any operation that must not run concurrently uses an explicit coordination primitive: `distributedLock`, BullMQ job deduplication, or `FOR UPDATE SKIP LOCKED`. We coordinate explicitly rather than assuming a single process because in-process locks are silently wrong under horizontal scaling — the failure only appears in production under load, where it is hard to diagnose.
