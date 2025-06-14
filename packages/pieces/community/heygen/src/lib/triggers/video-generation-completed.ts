import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { heygenAuth } from '../../index';

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
    created_at: '2023-01-01T12:00:00Z'
  },

  async onEnable(context) {
    console.log('Creating HeyGen webhook with URL:', context.webhookUrl);

    const webhook = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      '/v1/webhook/endpoint.add',
      {
        url: context.webhookUrl,
        events: ['video.completed']
      }
    );

    console.log('Webhook created:', webhook);

    await context.store.put('webhookId', webhook.id);
  },

  async onDisable(context) {
    const webhookId = await context.store.get('webhookId');

    if (webhookId) {
      await makeRequest(
        context.auth as string,
        HttpMethod.POST,
        '/v1/webhook/endpoint.delete',
        {
          id: webhookId
        }
      );
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