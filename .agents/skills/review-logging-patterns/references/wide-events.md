# Wide Events Guide

Wide events are comprehensive log entries that capture all context for a single logical operation (usually a request) in one place.

## Why Wide Events?

Traditional logging scatters information across many log lines:

```
10:23:45.001 Request received POST /checkout
10:23:45.012 User authenticated: user_123
10:23:45.045 Cart loaded: 3 items, $99.99
10:23:45.089 Payment initiated: Stripe
10:23:45.234 Payment failed: card_declined
10:23:45.235 Request completed: 500
```

During an incident, you're grep-ing through thousands of these trying to reconstruct what happened.

**Wide events emit once with everything:**

Development (pretty format):
```
10:23:45.235 ERROR [api] POST /checkout 500 in 234ms
  ├─ user: id=user_123 plan=premium accountAge=847
  ├─ cart: items=3 total=9999
  ├─ payment: provider=stripe method=card
  └─ error: code=card_declined retriable=false
```

Production (JSON format):
```json
{
  "timestamp": "2025-01-24T10:23:45.235Z",
  "level": "error",
  "service": "api",
  "method": "POST",
  "path": "/checkout",
  "duration": "234ms",
  "user": { "id": "user_123", "plan": "premium", "accountAge": 847 },
  "cart": { "items": 3, "total": 9999 },
  "payment": { "provider": "stripe", "method": "card" },
  "error": { "code": "card_declined", "retriable": false }
}
```

## When to Use Wide Events

| Scenario | Use Wide Event? |
|----------|----------------|
| HTTP request handling | Yes - one event per request |
| Background job execution | Yes - one event per job |
| Database query | No - use simple log |
| Cache hit/miss | No - include in parent wide event |
| User action (login, checkout) | Yes - one event per action |
| Debug statements | No - remove in production |

## Required Fields

Every wide event should include:

### Request Context

```typescript
log.set({
  method: 'POST',
  path: '/api/checkout',
  requestId: 'req_abc123',      // For tracing
  traceId: 'trace_xyz',         // Distributed tracing
})
```

### User Context

```typescript
log.set({
  user: {
    id: 'user_123',
    plan: 'premium',            // Business-relevant
    accountAge: 847,            // Days since signup
    subscription: 'annual',
  }
})
```

### Business Context

Add domain-specific data relevant to the operation:

```typescript
// E-commerce checkout
log.set({
  cart: { id: 'cart_xyz', items: 3, total: 9999 },
  payment: { method: 'card', provider: 'stripe' },
  order: { id: 'order_123', status: 'created' },
})

// API rate limiting
log.set({
  rateLimit: {
    limit: 1000,
    remaining: 42,
    resetAt: '2025-01-24T11:00:00Z',
  }
})

// File upload
log.set({
  upload: {
    filename: 'document.pdf',
    size: 1024000,
    mimeType: 'application/pdf',
  }
})
```

### Outcome

```typescript
// Success
log.set({
  status: 200,
  // duration is added automatically by emit()
})

// Error
log.error(error, {
  step: 'payment',
  retriable: false,
})
```

## Pattern: Request Logger in API Routes

### Nuxt/Nitro (Recommended)

With the evlog module, use `useLogger(event)` - it's auto-created and auto-emitted:

```typescript
// server/api/checkout.post.ts
// Nuxt: useLogger and createError are auto-imported
// Nitro v3: import { useLogger } from 'evlog/nitro/v3'
// Nitro v2: import { useLogger } from 'evlog/nitro'
import { createError } from 'evlog'

export default defineEventHandler(async (event) => {
  const log = useLogger(event)  // Auto-created by evlog

  const user = await requireAuth(event)
  log.set({ user: { id: user.id, plan: user.plan } })

  const cart = await getCart(user.id)
  log.set({ cart: { items: cart.items.length, total: cart.total } })

  try {
    const payment = await processPayment(cart, user)
    log.set({ payment: { id: payment.id, method: payment.method } })
  } catch (error) {
    log.error(error, { step: 'payment' })
    throw createError({
      message: 'Payment failed',
      why: error.message,
      fix: 'Try a different payment method',
    })
  }

  const order = await createOrder(cart, user)
  log.set({ order: { id: order.id, status: order.status } })

  return order
  // log.emit() is called automatically at request end
})
```

### Standalone TypeScript (Scripts, Workers)

Without Nuxt/Nitro, use `createRequestLogger()` and call `emit()` manually:

```typescript
// scripts/sync-job.ts
import { initLogger, createRequestLogger } from 'evlog'

initLogger({ env: { service: 'sync-worker', environment: 'production' } })

async function processJob(job: Job) {
  const log = createRequestLogger({ jobId: job.id, type: 'sync' })

  try {
    log.set({ source: job.source, target: job.target })

    const result = await performSync(job)
    log.set({ recordsSynced: result.count })

    return result
  } catch (error) {
    log.error(error, { step: 'sync' })
    throw error
  } finally {
    log.emit()  // Manual emit required
  }
}
```

## Transformation Examples

### Before: Console.log Spam

```typescript
// server/api/checkout.post.ts

export default defineEventHandler(async (event) => {
  console.log('Checkout started')

  const user = await getUser(event)
  console.log('User loaded:', user.id)

  const cart = await getCart(user.id)
  console.log('Cart loaded:', cart.items.length, 'items')

  try {
    const payment = await processPayment(cart)
    console.log('Payment successful:', payment.id)
    return { orderId: payment.orderId }
  } catch (error) {
    console.error('Payment failed:', error.message)
    throw error
  }
})
```

### After: Single Wide Event

```typescript
// server/api/checkout.post.ts
// Nuxt: useLogger and createError are auto-imported
// Nitro v3: import { useLogger } from 'evlog/nitro/v3'
// Nitro v2: import { useLogger } from 'evlog/nitro'
import { createError } from 'evlog'

export default defineEventHandler(async (event) => {
  const log = useLogger(event)

  const user = await getUser(event)
  log.set({ user: { id: user.id, plan: user.plan } })

  const cart = await getCart(user.id)
  log.set({ cart: { items: cart.items.length, total: cart.total } })

  try {
    const payment = await processPayment(cart)
    log.set({ payment: { id: payment.id }, order: { id: payment.orderId } })

    return { orderId: payment.orderId }
  } catch (error) {
    log.error(error, { step: 'payment' })
    throw createError({
      message: 'Payment failed',
      why: error.message,
      fix: 'Try a different payment method',
    })
  }
  // emit() called automatically
})
```

## Best Practices

### Do

- Include business-relevant context (user plan, cart value, etc.)
- Add enough context to debug without looking elsewhere
- Use consistent field names across your codebase
- Let `emit()` calculate duration automatically

### Don't

- Log sensitive data (passwords, tokens, full credit card numbers)
- Create multiple wide events for one logical operation
- Forget to call `emit()` (or use the Nuxt module for auto-emit)
- Include debugging logs inside wide events (remove them)

## Security: Preventing Sensitive Data Leakage

Always explicitly select which fields to log:

```typescript
// ❌ DANGEROUS - logs everything including password
log.set({ user: body })

// ✅ SAFE - explicitly select fields
log.set({
  user: {
    id: body.id,
    email: maskEmail(body.email),
    // password: body.password ← NEVER include
  },
})
```

**Never log:** passwords, API keys, tokens, secrets, full card numbers, CVV, SSN, PII, session tokens, JWTs.

**Sanitization helpers:**

```typescript
// server/utils/sanitize.ts
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  return `${local[0]}***@${domain[0]}***.${domain.split('.')[1]}`
}

export function maskCard(card: string): string {
  return `****${card.slice(-4)}`
}
```

See [code-review.md](code-review.md) for the full security review checklist.

## Field Naming Conventions

Use consistent, descriptive field names:

```typescript
// ✅ Good - grouped, descriptive
log.set({
  user: { id, plan, accountAge },
  cart: { items, total },
  payment: { method, provider },
})

// ❌ Bad - flat, abbreviated
log.set({
  uid: '123',
  n: 3,
  t: 9999,
  pm: 'card',
})
```
