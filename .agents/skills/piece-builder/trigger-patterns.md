# Trigger Patterns

Two main types: **Polling** (check API periodically) and **Webhook** (receive push notifications).

Prefer webhooks when the API supports them -- they are instant and use fewer resources.

---

## Polling Trigger

Use when the API does NOT support webhooks. Activepieces polls every ~5 minutes.

Two deduplication strategies:
- **TIMEBASED** -- Each item has a timestamp; only items newer than last poll are returned
- **LAST_ITEM** -- Each item has an ID; items after the last known ID are returned

### TIMEBASED Polling (most common)

```typescript
import { createTrigger, TriggerStrategy, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { myAppAuth } from '../../';

const polling: Polling<AppConnectionValueForAuthProperty<typeof myAppAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const response = await httpClient.sendRequest<{ data: any[] }>({
      method: HttpMethod.GET,
      url: 'https://api.example.com/v1/records',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
      queryParams: {
        sort: 'created_at',
        order: 'desc',
        limit: '100',
      },
    });
    return response.body.data.map((item) => ({
      epochMilliSeconds: new Date(item.created_at).getTime(),
      data: item,
    }));
  },
};

export const newRecordTrigger = createTrigger({
  auth: myAppAuth,
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is created',
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

**Real example:** `packages/pieces/community/airtable/src/lib/trigger/new-record.trigger.ts`

### LAST_ITEM Polling

Use when items have IDs but no reliable timestamps:

```typescript
const polling: Polling<undefined, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    const response = await httpClient.sendRequest<any[]>({
      method: HttpMethod.GET,
      url: 'https://api.example.com/v1/records',
      queryParams: { sort: 'id', order: 'desc', limit: '50' },
    });
    return response.body.map((item) => ({
      id: item.id,        // Unique identifier
      data: item,
    }));
  },
};
```

### Polling with Props

When the trigger has user-configurable props (e.g., filter by project):

```typescript
const props = {
  projectId: Property.Dropdown({ /* ... */ }),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof myAppAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    // propsValue.projectId is available here
    const response = await httpClient.sendRequest<{ data: any[] }>({
      method: HttpMethod.GET,
      url: `https://api.example.com/v1/projects/${propsValue.projectId}/records`,
      // ...
    });
    return response.body.data.map((item) => ({
      epochMilliSeconds: new Date(item.created_at).getTime(),
      data: item,
    }));
  },
};

export const newRecordTrigger = createTrigger({
  auth: myAppAuth,
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is created in a project',
  props,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  // test, onEnable, onDisable, run -- same pattern as above
});
```

---

## Webhook Trigger

Use when the API supports webhook registration. The flow:
1. `onEnable` -- Register a webhook with the third-party API using `context.webhookUrl`
2. `run` -- Process incoming webhook payloads
3. `onDisable` -- Delete the webhook when the flow is turned off

```typescript
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { myAppAuth } from '../../';

export const newRecordWebhookTrigger = createTrigger({
  auth: myAppAuth,
  name: 'new_record_webhook',
  displayName: 'New Record',
  description: 'Triggers when a new record is created',
  props: {},
  sampleData: {
    id: '123',
    name: 'Example record',
    created_at: '2024-01-01T00:00:00Z',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    // Register webhook with the external service
    const response = await httpClient.sendRequest<{ id: string }>({
      method: HttpMethod.POST,
      url: 'https://api.example.com/v1/webhooks',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      body: {
        url: context.webhookUrl,         // Activepieces provides this
        events: ['record.created'],
      },
    });
    // Store webhook ID for cleanup
    await context.store.put('webhookId', response.body.id);
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhookId');
    if (webhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.example.com/v1/webhooks/${webhookId}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth as string,
        },
      });
    }
  },

  async run(context) {
    // Return webhook payload as array (each element becomes a separate flow run)
    return [context.payload.body];
  },

  async test(context) {
    // Optional: fetch recent items for testing in the UI
    const response = await httpClient.sendRequest<{ data: any[] }>({
      method: HttpMethod.GET,
      url: 'https://api.example.com/v1/records',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      queryParams: { limit: '5' },
    });
    return response.body.data || [];
  },
});
```

**Real example:** `packages/pieces/community/stripe/src/lib/trigger/new-customer.ts`

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
    const oldId = await context.store.get<string>('webhookId');
    if (oldId) await deleteWebhook(oldId, context.auth);
    const newWebhook = await createWebhook(context.webhookUrl, context.auth);
    await context.store.put('webhookId', newWebhook.id);
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
