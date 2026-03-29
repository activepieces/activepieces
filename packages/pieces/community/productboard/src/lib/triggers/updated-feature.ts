import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { productboardAuth } from '../auth';

export const updatedFeature = createTrigger({
  auth: productboardAuth,
  name: 'updated_feature',
  displayName: 'Updated Feature',
  description: 'Triggers when a feature is updated',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    const response = await fetch('https://api.productboard.com/v1/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'webhook',
          attributes: {
            url: webhookUrl,
            events: ['feature.updated'],
          },
        },
      }),
    });

    const webhook = await response.json();
    await context.store.put('webhook_id', webhook.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get('webhook_id');
    if (webhookId) {
      await fetch(`https://api.productboard.com/v1/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${context.auth}`,
        },
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
