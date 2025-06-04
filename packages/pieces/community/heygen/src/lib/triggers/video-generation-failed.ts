import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { heygenAuth } from '../../index';

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
        events: ['video.failed']
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
    
    if (typeof payload === 'object' && payload !== null && payload['event'] === 'video.failed') {
      return [payload];
    }
    return [];
  },
});