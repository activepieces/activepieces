import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { heygenApiCall } from '../common/client';
import { heygenAuth } from '../common/auth';

export const videoGenerationCompletedTrigger = createTrigger({
  auth: heygenAuth,
  name: 'video_generation_completed',
  displayName: 'Video Generation Completed',
  description: 'Triggers when a video has finished processing successfully.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    event: 'video.completed',
    video_id: 'abc123',
    title: 'Example Video',
    status: 'completed',
    url: 'https://example.com/video.mp4',
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
        events: ['video.completed'],
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

    if (typeof payload === 'object' && payload !== null && payload['event'] === 'video.completed') {
      return [payload];
    }
    return [];
  },
});
