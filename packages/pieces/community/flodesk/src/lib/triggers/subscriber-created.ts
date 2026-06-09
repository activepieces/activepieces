import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { flodeskAuth } from '../auth';
import { flodeskApiCall } from '../common';

export const subscriberCreatedTrigger = createTrigger({
  auth: flodeskAuth,
  name: 'subscriber_created',
  displayName: 'Subscriber Created',
  description: 'Triggered when a new subscriber is created in Flodesk.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: '1234567890',
    email: 'subscriber@example.com',
    first_name: 'John',
    last_name: 'Doe',
    status: 'active',
    created_at: '2026-06-09T10:00:00.000Z',
    custom_fields: {},
    segments: [],
  },
  async onEnable(context) {
    const response = await flodeskApiCall<{ id: string }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      endpoint: '/webhooks',
      body: {
        name: 'Activepieces - Subscriber Created',
        post_url: context.webhookUrl,
        events: ['subscriber.created'],
      },
    });

    await context.store.put('subscriber_created_webhook', response.id);
  },
  async onDisable(context) {
    const storedWebhookId = await context.store.get<string>('subscriber_created_webhook');
    if (storedWebhookId) {
      await flodeskApiCall({
        apiKey: context.auth.secret_text,
        method: HttpMethod.DELETE,
        endpoint: `/webhooks/${storedWebhookId}`,
      });
      await context.store.delete('subscriber_created_webhook');
    }
  },
  async run(context) {
    const payload = context.payload.body;
    return [payload];
  },
});
