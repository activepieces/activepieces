# Structured Errors Guide

Structured errors provide context that helps developers understand **what** happened, **why** it happened, and **how to fix it**.

## The Problem with Generic Errors

```typescript
// ❌ Useless errors
throw new Error('Something went wrong')
throw new Error('Failed')
throw new Error('Invalid input')

// ❌ Missing context
throw new Error('Payment failed')  // Why? How do I fix it?
```

When these errors reach your logs or monitoring, you have no idea:

- What actually failed
- Why it failed
- How to fix it
- Where to find more information

## Structured Error Anatomy

```typescript
import { createError } from 'evlog'

throw createError({
  message: 'Payment failed',              // What happened
  status: 402,                            // HTTP status code
  why: 'Card declined by issuer',         // Why it happened
  fix: 'Try a different payment method',  // How to fix it
  link: 'https://docs.example.com/...',   // More information
  cause: originalError,                   // Original error
  internal: {                             // Optional: backend / logs only
    correlationId: 'pay_abc',
    processorCode: 'card_declined',
  },
})
```

### `internal` (backend-only)

- Use `internal` for IDs, gateway codes, or diagnostics that **must not** appear in HTTP error bodies or in client-side `parseError()` results.
- Access in server code via **`error.internal`**. Values are omitted from **`toJSON()`** and from framework serializers; they are included on wide events under **`error.internal`** when the error is captured with **`log.error()`** (or equivalent automatic capture).
- Stored with a non-enumerable symbol so `JSON.stringify(error)` does not leak `internal`; devtools may show it as `[Symbol(evlog.error.internal)]`.

### Console Output (Development)

```
Error: Payment failed
Why: Card declined by issuer
Fix: Try a different payment method
More info: https://docs.example.com/payments/declined

Caused by: StripeCardError: card_declined
```

### JSON Output (Production)

```json
{
  "name": "EvlogError",
  "message": "Payment failed",
  "why": "Card declined by issuer",
  "fix": "Try a different payment method",
  "link": "https://docs.example.com/payments/declined",
  "cause": {
    "name": "StripeCardError",
    "message": "card_declined"
  },
  "stack": "..."
}
```

## Field Guidelines

### `message` - What Happened

User-facing description of what went wrong.

```typescript
// ✅ Good - clear, actionable
message: 'Failed to sync repository'
message: 'Unable to process payment'
message: 'User not found'

// ❌ Bad - vague, unhelpful
message: 'Error'
message: 'Something went wrong'
message: 'Failed'
```

### `why` - Why It Happened

Technical explanation for debugging.

```typescript
// ✅ Good - specific, technical
why: 'GitHub API rate limit exceeded (403)'
why: 'Card declined by issuer: insufficient_funds'
why: 'No user with ID "user_123" exists in database'

// ❌ Bad - just restating the message
why: 'It failed'
why: 'Error occurred'
```

### `fix` - How to Fix It

Actionable steps to resolve the issue.

```typescript
// ✅ Good - specific actions
fix: 'Wait 1 hour or use a different API token'
fix: 'Use a different payment method or contact your bank'
fix: 'Check the user ID and try again'

// ❌ Bad - not actionable
fix: 'Fix the error'
fix: 'Try again'
```

### `link` - More Information

Documentation URL for detailed troubleshooting.

```typescript
// ✅ Good - specific documentation
link: 'https://docs.github.com/en/rest/rate-limit'
link: 'https://docs.stripe.com/declines/codes'
link: 'https://your-app.com/docs/errors/user-not-found'
```

### `cause` - Original Error

The underlying error that triggered this one.

```typescript
try {
  await stripe.charges.create(...)
} catch (error) {
  throw createError({
    message: 'Payment failed',
    why: `Stripe error: ${error.code}`,
    fix: 'Contact support with error code',
    cause: error,  // Preserves original stack trace
  })
}
```

## Common Error Patterns

### API/External Service Errors

```typescript
// Rate limiting
throw createError({
  message: 'GitHub sync temporarily unavailable',
  status: 429,
  why: 'API rate limit exceeded (5000/hour)',
  fix: 'Wait until rate limit resets or use authenticated requests',
  link: 'https://docs.github.com/en/rest/rate-limit',
  cause: error,
})

// Authentication
throw createError({
  message: 'Unable to connect to Stripe',
  status: 503,
  why: 'Invalid API key provided',
  fix: 'Check STRIPE_SECRET_KEY environment variable',
  link: 'https://docs.stripe.com/keys',
  cause: error,
})

// Network
throw createError({
  message: 'Failed to fetch user data',
  status: 504,
  why: 'Connection timeout after 30s',
  fix: 'Check network connectivity and try again',
  cause: error,
})
```

### Validation Errors

```typescript
// Missing required field
throw createError({
  message: 'Invalid checkout request',
  status: 400,
  why: 'Required field "email" is missing',
  fix: 'Include a valid email address in the request body',
  link: 'https://your-api.com/docs/checkout#request-body',
})

// Invalid format
throw createError({
  message: 'Invalid email format',
  status: 422,
  why: `"${email}" is not a valid email address`,
  fix: 'Provide an email in the format user@example.com',
})

// Business rule violation
throw createError({
  message: 'Cannot cancel subscription',
  status: 409,
  why: 'Subscription has already been cancelled',
  fix: 'No action needed - subscription is already inactive',
})
```

### Database Errors

```typescript
// Not found
throw createError({
  message: 'User not found',
  status: 404,
  why: `No user with ID "${userId}" exists`,
  fix: 'Verify the user ID is correct',
})

// Constraint violation
throw createError({
  message: 'Cannot create duplicate account',
  status: 409,
  why: `User with email "${email}" already exists`,
  fix: 'Use a different email or log in to existing account',
  link: 'https://your-app.com/login',
})

// Connection
throw createError({
  message: 'Database unavailable',
  status: 503,
  why: 'Connection pool exhausted',
  fix: 'Reduce concurrent connections or increase pool size',
  cause: error,
})
```

### Permission Errors

```typescript
throw createError({
  message: 'Access denied',
  status: 403,
  why: 'User lacks "admin" role required for this action',
  fix: 'Contact an administrator to request access',
  link: 'https://your-app.com/docs/permissions',
})
```

## Transformation Examples

### Before: Generic Error

```typescript
async function processPayment(cart, user) {
  try {
    return await stripe.charges.create({
      amount: cart.total,
      currency: 'usd',
      source: user.paymentMethodId,
    })
  } catch (error) {
    throw new Error('Payment failed')  // ❌ No context
  }
}
```

### After: Structured Error

```typescript
async function processPayment(cart, user) {
  try {
    return await stripe.charges.create({
      amount: cart.total,
      currency: 'usd',
      source: user.paymentMethodId,
    })
  } catch (error) {
    throw createError({
      message: 'Payment failed',
      why: getStripeErrorReason(error),
      fix: getStripeErrorFix(error),
      link: 'https://docs.stripe.com/declines/codes',
      cause: error,
    })
  }
}

function getStripeErrorReason(error) {
  const reasons = {
    card_declined: 'Card was declined by the issuer',
    insufficient_funds: 'Card has insufficient funds',
    expired_card: 'Card has expired',
    // ...
  }
  return reasons[error.code] ?? `Stripe error: ${error.code}`
}

function getStripeErrorFix(error) {
  const fixes = {
    card_declined: 'Try a different payment method or contact your bank',
    insufficient_funds: 'Use a different card or add funds',
    expired_card: 'Update your card details with a valid expiration date',
    // ...
  }
  return fixes[error.code] ?? 'Contact support with error code'
}
```

## Integration with Wide Events

Structured errors integrate seamlessly with wide events:

```typescript
// server/api/checkout.post.ts
// Nuxt: useLogger and createError are auto-imported
// Nitro v3: import { useLogger } from 'evlog/nitro/v3'
// Nitro v2: import { useLogger } from 'evlog/nitro'
import { createError } from 'evlog'

export default defineEventHandler(async (event) => {
  const log = useLogger(event)

  try {
    // ... business logic ...
  } catch (error) {
    // EvlogError fields are automatically captured
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

The wide event will include:

```json
{
  "error": {
    "name": "EvlogError",
    "message": "Payment failed",
    "why": "Card declined by issuer",
    "fix": "Try a different payment method",
    "link": "https://docs.stripe.com/declines/codes",
    "internal": {
      "stripeRequestId": "req_123"
    }
  },
  "step": "payment"
}
```

If you use `createError({ ..., internal: { ... } })` without calling `log.error(error)` yourself, framework integrations that attach thrown errors to the wide event still merge **`internal`** into **`error.internal`** on emit.

## Best Practices

### Do

- Always provide `message` and `why` at minimum
- Include `fix` when there's an actionable solution
- Add `link` to documentation for complex errors
- Preserve `cause` when wrapping errors
- Be specific about what failed and why
- Put operator-only or sensitive diagnostics in `internal`, not in `why`/`fix`/`message`

### Don't

- Use generic messages like "Error" or "Failed"
- Leak sensitive data (passwords, tokens, PII)
- Expect `internal` in HTTP JSON or in `parseError()` — it is for server logs and drains only
- Make `why` and `message` identical
- Suggest fixes that aren't actually possible
- Create errors without any context

## Nitro Compatibility

evlog errors work with any Nitro-powered framework. When thrown in an API route, the error is automatically converted to an HTTP response:

```typescript
// Backend - just throw
throw createError({
  message: 'Payment failed',
  status: 402,
  why: 'Card declined',
  fix: 'Try another card',
  link: 'https://docs.example.com/payments',
})

// HTTP Response:
// Status: 402
// Body: {
//   statusCode: 402,
//   message: "Payment failed",
//   data: { why: "Card declined", fix: "Try another card", link: "..." }
// }
```

### Frontend Integration

Use `parseError()` to extract all fields at the top level:

```typescript
import { parseError } from 'evlog'

try {
  await $fetch('/api/checkout')
} catch (err) {
  const error = parseError(err)

  // Direct access: error.message, error.why, error.fix, error.link
  toast.add({
    title: error.message,
    description: error.why,
    color: 'error',
    actions: error.link
      ? [{ label: 'Learn more', onClick: () => window.open(error.link) }]
      : undefined,
  })

  if (error.fix) console.info(`💡 Fix: ${error.fix}`)
}
```

**The difference**: A generic error shows "An error occurred". A structured error shows the message, explains why, suggests a fix, and links to documentation.

## Error Message Templates

Common patterns -- adapt fields to each specific case:

| Pattern | Status | Fields |
|---------|--------|--------|
| Resource not found | 404 | `why`: what's missing, `fix`: verify identifier |
| External service failure | 503 | `why`: service error, `fix`: actionable step, `link`: service docs, `cause`: original error |
| Validation failure | 400 | `why`: what's invalid, `fix`: expected format |
| Permission denied | 403 | `why`: what's required, `fix`: how to get access |
