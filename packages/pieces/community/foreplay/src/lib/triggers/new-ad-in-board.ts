import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { foreplayAuth } from '../auth';

export const newAdInBoard = createTrigger({
  auth: foreplayAuth,
  name: 'new_ad_in_board',
  displayName: 'New Ad in Board',
  description: 'Triggers when a new ad in user board',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const response = await fetch('https://public.api.foreplay.co/v1/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: context.webhookUrl,
        events: ['board.ad.created'],
      }),
    });
    const webhook = await response.json();
    await context.store.put('webhook_id', webhook.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get('webhook_id');
    if (webhookId) {
      await fetch(`https://public.api.foreplay.co/v1/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${context.auth}` },
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
