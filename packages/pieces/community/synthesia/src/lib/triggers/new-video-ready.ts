import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { synthesiaAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface WebhookData {
  webhookId: string;
}

export const newVideoReady = createTrigger({
  auth: synthesiaAuth,
  name: 'newVideoReady',
  displayName: 'New Video Ready',
  description: 'Trigger when a new video is completed in Synthesia',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.synthesia.io/v2/webhooks',
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: {
        url: webhookUrl,
        events: ['video.completed'],
      },
    });

    await context.store.put<WebhookData>('webhookData', {
      webhookId: response.body.id,
    });
  
  },
  async onDisable(context) {
    const webhookData = await context.store.get<WebhookData>('webhookData');
    if (webhookData) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.synthesia.io/v2/webhooks/${webhookData.webhookId}`,
        headers: {
          Authorization: `Bearer ${context.auth.secret_text}`,
          'Content-Type': 'application/json',
        },
      });
    }
    await context.store.delete('webhookData');
  },
  async run(context) {
    const payload = context.payload as any;
    if (payload.type !== 'video.completed') {
      return [];
    }
    return [context.payload.body];
  },
});
