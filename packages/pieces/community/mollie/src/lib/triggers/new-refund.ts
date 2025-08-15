import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const newRefundTrigger = createTrigger({
  auth: mollieAuth,
  name: 'new_refund',
  displayName: 'New Refund',
  description: 'Fires when a payment refund is created in Mollie',
  props: {},
  sampleData: {
    id: 're_example123',
    amount: {
      value: '5.00',
      currency: 'EUR'
    },
    status: 'pending',
    createdAt: '2024-01-01T12:00:00+00:00'
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.mollie.com/v2/webhooks',
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
      },
      body: {
        url: webhookUrl,
        events: ['refunds.*'],
      },
    });
    await context.store.put('webhook_id', response.body.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get('webhook_id');
    if (webhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.mollie.com/v2/webhooks/${webhookId}`,
        headers: {
          Authorization: `Bearer ${context.auth.access_token}`,
        },
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});