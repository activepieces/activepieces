import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { kudosityAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const linkHit = createTrigger({
  auth: kudosityAuth,
  name: 'linkHit',
  displayName: 'Link Hit',
  description: 'Triggered when a tracked link in a message is clicked',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    const apiKey = context.auth.secret_text;

    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.transmitmessage.com/v2/webhook',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: {
        name: 'ActivePieces Link Hit Webhook',
        filter: {
          event_type: ['LINK_HIT'],
        },
        url: webhookUrl,
      },
    });

    const webhookId = res.body.id;
    await context.store.put('webhookId', webhookId);
  },
  async onDisable(context) {
    const apiKey = context.auth.secret_text;
    const storedWebhookId = await context.store.get('webhookId');

    if (storedWebhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.transmitmessage.com/v2/webhook/${storedWebhookId}`,
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });
    }
    await context.store.delete('webhookId');
  },
  async run(context) {
    const body = context.payload.body as any;
    if (body.event_type !== 'LINK_HIT') {
      return [];
    }
    return [context.payload.body];
  },
});
