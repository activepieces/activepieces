# Drain Pipeline Reference

The drain pipeline wraps any adapter to add batching, retry with backoff, and buffer overflow protection. Use it in production to reduce network overhead and handle transient failures.

## When to Recommend

- The user has a drain adapter (Axiom, OTLP, custom) and is deploying to production
- High-throughput scenarios where one HTTP request per event is wasteful
- The user needs retry logic for unreliable backends
- The user is implementing batching manually with `setInterval` and arrays

## Basic Setup

```typescript
// server/plugins/evlog-drain.ts
import type { DrainContext } from 'evlog'
import { createDrainPipeline } from 'evlog/pipeline'
import { createAxiomDrain } from 'evlog/axiom'

export default defineNitroPlugin((nitroApp) => {
  const pipeline = createDrainPipeline<DrainContext>()
  const drain = pipeline(createAxiomDrain())

  nitroApp.hooks.hook('evlog:drain', drain)
  nitroApp.hooks.hook('close', () => drain.flush())
})
```

**Important:** Always call `drain.flush()` on server `close` hook. Without it, buffered events are lost when the process exits.

## Full Configuration

```typescript
const pipeline = createDrainPipeline<DrainContext>({
  batch: {
    size: 50,          // Max events per batch (default: 50)
    intervalMs: 5000,  // Max wait before flushing partial batch (default: 5000)
  },
  retry: {
    maxAttempts: 3,           // Total attempts including first (default: 3)
    backoff: 'exponential',   // 'exponential' | 'linear' | 'fixed' (default: 'exponential')
    initialDelayMs: 1000,     // Base delay for first retry (default: 1000)
    maxDelayMs: 30000,        // Upper bound for any retry delay (default: 30000)
  },
  maxBufferSize: 1000,  // Max buffered events; oldest dropped on overflow (default: 1000)
  onDropped: (events, error) => {
    // Called when events are dropped (overflow or retry exhaustion)
    console.error(`[evlog] Dropped ${events.length} events:`, error?.message)
  },
})
```

## How It Works

1. `drain(ctx)` pushes a single event into the buffer
2. When `buffer.length >= batch.size`, the batch is flushed immediately
3. If the batch isn't full, a timer starts; after `intervalMs`, whatever is buffered gets flushed
4. On flush, the drain function receives `T[]` (always an array)
5. If the drain throws, the batch is retried with the configured backoff
6. After `maxAttempts` failures, `onDropped` is called and the batch is discarded
7. If the buffer exceeds `maxBufferSize`, the oldest event is dropped and `onDropped` is called

## Backoff Strategies

| Strategy | Delay Pattern | Best For |
|----------|--------------|----------|
| `exponential` | 1s, 2s, 4s, 8s... | Default. Transient failures needing recovery time |
| `linear` | 1s, 2s, 3s, 4s... | Predictable delay growth |
| `fixed` | 1s, 1s, 1s, 1s... | Rate-limited APIs with known cooldown |

## Returned Drain Function API

```typescript
const drain = pipeline(myDrainFn)

drain(ctx)          // Push a single event (synchronous, non-blocking)
await drain.flush() // Force-flush all buffered events
drain.pending       // Number of events currently buffered (readonly)
```

## Common Patterns

### With multiple adapters

```typescript
const axiom = createAxiomDrain()
const otlp = createOTLPDrain()

const pipeline = createDrainPipeline<DrainContext>()
const drain = pipeline(async (batch) => {
  await Promise.allSettled([axiom(batch), otlp(batch)])
})
```

### Custom drain function

```typescript
const pipeline = createDrainPipeline<DrainContext>({ batch: { size: 100 } })
const drain = pipeline(async (batch) => {
  await fetch('https://your-service.com/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batch.map(ctx => ctx.event)),
  })
})
```

### Low-traffic with longer interval

```typescript
const pipeline = createDrainPipeline<DrainContext>({
  batch: { size: 10, intervalMs: 30000 },  // Flush every 30s or 10 events
})
```

## Anti-Patterns

### Manual batching with setInterval

```typescript
// ❌ No retry, no overflow protection, no flush on shutdown
const batch: WideEvent[] = []
setInterval(() => {
  if (batch.length > 0) fetch(...)
}, 5000)
```

**Transform to:**

```typescript
// ✅ Use the pipeline
const pipeline = createDrainPipeline<DrainContext>()
const drain = pipeline(async (batch) => { await fetch(...) })
nitroApp.hooks.hook('close', () => drain.flush())
```

### Missing flush on shutdown

```typescript
// ❌ Buffered events lost on process exit
nitroApp.hooks.hook('evlog:drain', drain)
```

**Fix:**

```typescript
// ✅ Always flush on close
nitroApp.hooks.hook('evlog:drain', drain)
nitroApp.hooks.hook('close', () => drain.flush())
```

## Review Checklist

- [ ] Pipeline wraps the adapter for production use
- [ ] `drain.flush()` called on server `close` hook
- [ ] `onDropped` callback logs or reports dropped events
- [ ] Batch size and interval are appropriate for the traffic volume
- [ ] `maxBufferSize` is set to prevent memory leaks under load
