# Code Review Checklist

Use this checklist when reviewing code for logging best practices and evlog adoption.

## Quick Scan

Run through these checks first to identify improvement opportunities:

### 1. Console Statement Audit

Search for these patterns:

```typescript
// ❌ Patterns to find and transform
console.log(...)
console.error(...)
console.warn(...)
console.info(...)
console.debug(...)
```

**Questions to ask:**

- Are there multiple console statements in one function?
- Are they logging request/response data?
- Could they be consolidated into a wide event?

### 2. Error Pattern Audit

Search for these patterns:

```typescript
// ❌ Generic errors
throw new Error('...')
throw Error('...')

// ❌ Re-throwing without context
catch (error) {
  throw error
}

// ❌ Logging and throwing
catch (error) {
  console.error(error)
  throw error
}
```

**Questions to ask:**

- Does the error message explain what happened?
- Is there a `why` explaining the root cause?
- Is there a `fix` suggesting a solution?
- Is the original error preserved as `cause`?

### 3. Request Handler Audit

For each API route/handler, check:

```typescript
// ❌ Missing request context
export default defineEventHandler(async (event) => {
  // No logging at all, or scattered console.logs
})
```

**Questions to ask:**

- Is there a request-scoped logger?
- Is context accumulated throughout the request?
- Is there a single emit at the end?

## Detailed Review

### Console.log Transformations

#### Single Debug Log

```typescript
// ❌ Before
console.log('Processing user:', userId)

// ✅ After - if part of a larger operation
log.set({ user: { id: userId } })

// ✅ After - if standalone debug
log.debug('user', `Processing user ${userId}`)
```

#### Multiple Related Logs

```typescript
// ❌ Before
console.log('Starting checkout')
console.log('User:', user.id)
console.log('Cart items:', cart.items.length)
console.log('Total:', cart.total)

// ✅ After
log.info({
  action: 'checkout',
  user: { id: user.id },
  cart: { items: cart.items.length, total: cart.total },
})
```

#### Request Lifecycle Logs

```typescript
// server/api/process.post.ts

// ❌ Before
export default defineEventHandler(async (event) => {
  console.log('Request started')
  const user = await getUser(event)
  console.log('User loaded')
  const result = await processData(user)
  console.log('Processing complete')
  return result
})

// ✅ After (Nuxt - auto-imported, no import needed)
// For Nitro v3: import { useLogger } from 'evlog/nitro/v3'
// For Nitro v2: import { useLogger } from 'evlog/nitro'

export default defineEventHandler(async (event) => {
  const log = useLogger(event)

  const user = await getUser(event)
  log.set({ user: { id: user.id } })

  const result = await processData(user)
  log.set({ result: { id: result.id } })

  return result
  // emit() called automatically
})
```

### Error Transformations

#### Generic Error

```typescript
// ❌ Before
throw new Error('Failed to create user')

// ✅ After
throw createError({
  message: 'Failed to create user',
  why: 'Email address already registered',
  fix: 'Use a different email or log in to existing account',
  link: 'https://your-app.com/docs/registration',
})
```

#### Wrapped Error Without Context

```typescript
// ❌ Before
try {
  await externalApi.call()
} catch (error) {
  throw new Error('API call failed')
}

// ✅ After
try {
  await externalApi.call()
} catch (error) {
  throw createError({
    message: 'External API call failed',
    why: `API returned: ${error.message}`,
    fix: 'Check API credentials and try again',
    link: 'https://api-docs.example.com/errors',
    cause: error,
  })
}
```

#### Log-and-Throw Anti-pattern

```typescript
// ❌ Before
try {
  await riskyOperation()
} catch (error) {
  console.error('Operation failed:', error)
  throw error
}

// ✅ After
try {
  await riskyOperation()
} catch (error) {
  log.error(error, { step: 'riskyOperation' })
  throw createError({
    message: 'Operation failed',
    why: error.message,
    fix: 'Check input and retry',
    cause: error,
  })
}
```

### Request Handler Transformations

#### No Logging

```typescript
// server/api/orders.post.ts

// ❌ Before
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = await processOrder(body)
  return result
})

// ✅ After (Nuxt - auto-imported, no import needed)
// For Nitro v3: import { useLogger } from 'evlog/nitro/v3'
// For Nitro v2: import { useLogger } from 'evlog/nitro'
import { createError } from 'evlog'

export default defineEventHandler(async (event) => {
  const log = useLogger(event)

  const body = await readBody(event)
  log.set({ order: { items: body.items?.length } })

  try {
    const result = await processOrder(body)
    log.set({ result: { orderId: result.id, status: result.status } })
    return result
  } catch (error) {
    log.error(error, { step: 'processOrder' })
    throw createError({
      message: 'Order processing failed',
      why: error.message,
      fix: 'Check the order data and try again',
    })
  }
  // emit() called automatically
})
```

## Review Checklist Summary

### Logging

- [ ] No raw `console.log` statements in production code
- [ ] Request handlers use `useLogger(event)` (Nuxt/Nitro) or `createRequestLogger()` (standalone)
- [ ] Context is accumulated with `log.set()` throughout the request
- [ ] `emit()` is automatic with `useLogger()`, manual with `createRequestLogger()`
- [ ] Wide events include: user, business context, outcome

### Errors

- [ ] All errors use `createError()` instead of `new Error()` (import from `evlog`)
- [ ] Every error has a clear `message` and appropriate `status` code
- [ ] Complex errors include `why` explaining root cause
- [ ] Fixable errors include `fix` with actionable steps
- [ ] Documented errors include `link` to docs
- [ ] Wrapped errors preserve `cause`
- [ ] Support-only or sensitive diagnostics use `internal`, not `message` / `why` / `fix`

### Frontend Error Handling

- [ ] API errors are caught and displayed with full context (message, why, fix)
- [ ] Toasts or error components use the structured data from `error.data.data`
- [ ] Links to documentation are actionable (buttons/links in toasts)

### Context

- [ ] User context includes: id, plan/subscription, relevant business data
- [ ] Request context includes: method, path, requestId
- [ ] Business context is domain-specific and useful for debugging
- [ ] No sensitive data in logs (passwords, tokens, full card numbers)

## Anti-Pattern Summary

| Anti-Pattern | Fix |
|--------------|-----|
| Multiple `console.log` in one function | Single wide event with `useLogger(event).set()` |
| `throw new Error('...')` | `throw createError({ message, status, why, fix })` |
| `console.error(e); throw e` | `log.error(e); throw createError(...)` |
| No logging in request handlers | Add `useLogger(event)` (Nuxt/Nitro) or `createRequestLogger()` (standalone) |
| Flat log data | Grouped objects: `{ user: {...}, cart: {...} }` |
| Abbreviated field names | Descriptive names: `userId` not `uid` |

## Suggested Review Comments

Use these when leaving review feedback:

### Console.log Found

> Consider using evlog's wide event pattern here. Instead of multiple console.log statements, use `useLogger(event)` to accumulate context and emit a single comprehensive event.

### Generic Error

> This error would benefit from evlog's structured error pattern. Consider using `import { createError } from 'evlog'` and `createError({ message, status, why, fix })` to provide more debugging context.

### Missing Request Context

> This handler would benefit from request-scoped logging. Add `useLogger(event)` at the start to capture context throughout the request lifecycle.

### Good Logging (Positive Feedback)

> Nice use of wide events here! The context is well-structured and will be very useful for debugging.
