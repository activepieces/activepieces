import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { flodeskAuth } from '../auth';
import { flodeskApiCall } from '../common';

export const subscriberUnsubscribedTrigger = createTrigger({
  auth: flodeskAuth,
  name: 'subscriber_unsubscribed',
  displayName: 'Subscriber Unsubscribed',
  description: 'Triggered when a subscriber unsubscribes from your Flodesk account.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: '1234567890',
    email: 'subscriber@example.com',
    first_name: 'John',
    last_name: 'Doe',
    status: 'unsubscribed',
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
        url: context.webhookUrl,
        events: ['subscriber.unsubscribed'],
      },
    });

    await context.store.put('subscriber_unsubscribed_webhook', response.id);
  },
  async onDisable(context) {
    const storedWebhookId = await context.store.get<string>('subscriber_unsubscribed_webhook');
    if (storedWebhookId) {
      await flodeskApiCall({
        apiKey: context.auth.secret_text,
        method: HttpMethod.DELETE,
        endpoint: `/webhooks/${storedWebhookId}`,
      });
    }
  },
  async run(context) {
    const payload = context.payload.body;
    return [payload];
  },
});
