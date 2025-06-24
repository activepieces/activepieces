import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { heygenApiCall } from '../common/client';
import { heygenAuth } from '../common/auth';

export const videoGenerationFailedTrigger = createTrigger({
  auth: heygenAuth,
  name: 'video_generation_failed',
  displayName: 'Video Generation Failed',
  description: 'Triggers when a video generation process fails.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    event: 'video.failed',
    video_id: 'abc123',
    title: 'Example Video',
    status: 'failed',
    error: 'Processing error occurred',
    callback_id: 'custom-callback-id',
    created_at: '2023-01-01T12:00:00Z',
  },

  async onEnable(context) {
    const webhook = await heygenApiCall({
      apiKey: context.auth as string,
      method: HttpMethod.POST,
      resourceUri: '/webhook/endpoint.add',
      apiVersion: 'v1',
      body: {
        url: context.webhookUrl,
        events: ['video.failed'],
      },
    }) as { id: string };

    await context.store.put('webhookId', webhook.id);
  },

  async onDisable(context) {
    const webhookId = await context.store.get('webhookId');

    if (webhookId) {
      await heygenApiCall({
        apiKey: context.auth as string,
        method: HttpMethod.POST,
        resourceUri: '/webhook/endpoint.delete',
        apiVersion: 'v1',
        body: {
          id: webhookId,
        },
      });
    }
  },

  async run(context) {
    const payload = context.payload.body as Record<string, unknown>;

    if (typeof payload === 'object' && payload !== null && payload['event'] === 'video.failed') {
      return [payload];
    }
    return [];
  },
});
