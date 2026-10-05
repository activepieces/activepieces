# Trigger Patterns

Two main types: **Polling** (check API periodically) and **Webhook** (receive push notifications).

Prefer webhooks when the API supports them -- they are instant and use fewer resources.

---

## Polling Trigger

Use when the API has no webhook support. Activepieces polls every ~5 minutes.

Two deduplication strategies:
- **TIMEBASED** -- Each item has a timestamp; only items newer than last poll are returned
- **LAST_ITEM** -- Each item has an ID; items after the last known ID are returned

**Always pass the whole `context`** to `pollingHelper.onEnable` / `onDisable` / `poll` / `test` -- never a subset like `{ store, auth, propsValue }`. Every field on the helper's param type is optional, so a partial object type-checks and whatever you left out is dropped in silence. The set also grows: `onEnable` now reads `context.isRepublish` to keep the existing `lastPoll`/`lastItem` when a running flow is republished, so a subset call still resets the checkpoint and drops every event since the last poll.

**Editing an existing polling trigger? Fix every `pollingHelper` call in the piece while you're there.** Most pieces in the repo still pass the subset — the SKILL.md carve-out explains why fix-on-touch beats a repo-wide codemod. Mention the fix in your PR description so it doesn't read as an unrelated change.

Triggers live in `src/lib/triggers/<noun>-<event>.ts`, with no `.trigger.ts` suffix. Like actions, they call `myAppApi`, never `httpClient` or the SDK (see `piece-layout.md`).

### TIMEBASED Polling (most common)

```typescript
import { createTrigger, TriggerStrategy, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { myAppAuth } from '../auth';
import { myAppApi } from '../common/api';

const polling: Polling<AppConnectionValueForAuthProperty<typeof myAppAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const tasks = await myAppApi.listRecentTasks({ auth, limit: 100 });
    return tasks.map((task) => ({
      epochMilliSeconds: new Date(task.created_at).getTime(),
      data: task,
    }));
  },
};

export const taskCreatedTrigger = createTrigger({
  auth: myAppAuth,
  name: 'task_created',
  displayName: 'New Task',
  description: 'Triggers when a new task is created.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
```

### LAST_ITEM Polling

Use when items have IDs but no reliable timestamps:

```typescript
const polling: Polling<AppConnectionValueForAuthProperty<typeof myAppAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const tasks = await myAppApi.listRecentTasks({ auth, limit: 50 });
    return tasks.map((task) => ({
      id: task.id,        // Unique identifier
      data: task,
    }));
  },
};
```

### Polling with Props

When the trigger has user-configurable props (e.g., a project filter), update the Polling generic type to include them:

```typescript
const props = { projectId: myAppProps.projectId({ required: true }) };

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof myAppAuth>,
  StaticPropsValue<typeof props>  // ← add your props type here
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const tasks = await myAppApi.listRecentTasks({ auth, projectId: propsValue.projectId, limit: 100 });
    return tasks.map((task) => ({
      epochMilliSeconds: new Date(task.created_at).getTime(),
      data: task,
    }));
  },
};
```

Pass `props` to `createTrigger` — everything else follows the same pattern as the basic TIMEBASED example above.

---

## Webhook Trigger

Use when the API supports webhook registration. The flow:
1. `onEnable` -- Register a webhook with the third-party API using `context.webhookUrl`
2. `run` -- Process incoming webhook payloads
3. `onDisable` -- Delete the webhook when the flow is turned off

Subscribe / unsubscribe / verify live once in `common/webhook.ts` (`myAppWebhook`; blueprint in `piece-layout.md`). Each webhook trigger keeps only its event name and its payload mapping.

```typescript
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { myAppAuth } from '../auth';
import { myAppApi } from '../common/api';
import { myAppWebhook } from '../common/webhook';

export const taskCreatedTrigger = createTrigger({
  auth: myAppAuth,
  name: 'task_created',
  displayName: 'New Task',
  description: 'Triggers when a new task is created.',
  props: {},
  sampleData: {
    id: '123',
    title: 'Example task',
    created_at: '2024-01-01T00:00:00Z',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    await myAppWebhook.enable({ auth: context.auth, store: context.store, webhookUrl: context.webhookUrl, events: ['task.created'] });
  },

  async onDisable(context) {
    await myAppWebhook.disable({ auth: context.auth, store: context.store });
  },

  async run(context) {
    // Return webhook payload as array (each element becomes a separate flow run)
    return [context.payload.body];
  },

  async test(context) {
    // Optional: fetch recent items for testing in the UI
    return await myAppApi.listRecentTasks({ auth: context.auth, limit: 5 });
  },
});
```

If the vendor signs payloads, check `await myAppWebhook.verify({ store: context.store, signature, rawBody })` at the top of `run`, and return `[]` when it fails.

### Webhook with Nested Event Data

Many APIs wrap the event data. Extract the relevant part:

```typescript
async run(context) {
  const payload = context.payload.body as { data: { object: unknown } };
  return [payload.data.object];  // Stripe pattern
}
```

### Webhook Handshake (Challenge-Response)

Some APIs (Slack, Okta) send a verification challenge on registration:

```typescript
import { WebhookHandshakeStrategy } from '@activepieces/pieces-framework';

export const myTrigger = createTrigger({
  // ...
  type: TriggerStrategy.WEBHOOK,
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.HEADER_PRESENT,
    paramName: 'x-verification-challenge',
  },
  async onHandshake(context) {
    const challenge = context.payload.headers['x-verification-challenge'];
    return {
      status: 200,
      body: { challenge },
      headers: { 'Content-Type': 'application/json' },
    };
  },
  // ... rest of trigger
});
```

### Webhook Renewal

For APIs where webhooks expire (e.g., Google Sheets):

```typescript
import { WebhookRenewStrategy } from '@activepieces/pieces-framework';

export const myTrigger = createTrigger({
  // ...
  renewConfiguration: {
    strategy: WebhookRenewStrategy.CRON,
    cronExpression: '0 */12 * * *',  // Every 12 hours
  },
  async onRenew(context) {
    // Delete old webhook and create new one
    await myAppWebhook.disable({ auth: context.auth, store: context.store });
    await myAppWebhook.enable({ auth: context.auth, store: context.store, webhookUrl: context.webhookUrl, events: ['task.created'] });
  },
  // ...
});
```

---

## Trigger Strategy Summary

| Strategy | When to Use | Key Points |
|----------|------------|------------|
| `TriggerStrategy.POLLING` | API has no webhooks | Use `pollingHelper` with TIMEBASED or LAST_ITEM |
| `TriggerStrategy.WEBHOOK` | API supports webhook registration | Register in `onEnable`, delete in `onDisable` |
| `TriggerStrategy.APP_WEBHOOK` | OAuth2 apps with platform-level webhooks (Slack) | Use `context.app.createListeners()` |

---

## AI-Ready Metadata (required on new triggers)

Every new trigger ships with `aiMetadata: { description }` — one or two sentences on when the event fires and what one payload represents. Triggers do **not** take `audience` (actions-only — a trigger is an event, not an agent-callable operation) and don't need `idempotent`. The field is additive and changes nothing for human users. See `ai-metadata.md`.
