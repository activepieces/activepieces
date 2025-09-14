import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../..';

interface WebhookInfo {
  endpoint_id: string;
}

export const videoGeneratedSuccessfully = createTrigger({
  name: 'videoGeneratedSuccessfully',
  displayName: 'Video Generated Successfully',
  description: 'Fires when a video is generated successfully',
  auth: joggAiAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},

  sampleData: {
    event_id: 'evt_123456789',
    event: 'generated_video_success',
    timestamp: 1703894400,
    data: {
      project_id: 'abc123',
      video_url: 'https://res.jogg.ai/video.mp4',
      duration: 30,
    },
  },

  async onEnable(context) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.jogg.ai/v1/webhook/endpoint',
        headers: {
          'x-api-key': context.auth,
          'Content-Type': 'application/json',
        },
        body: {
          url: context.webhookUrl,
          events: ['generated_video_success'],
          status: 'enabled',
        },
      });

      const webhookData = response.body;
      if (webhookData.data?.endpoint_id) {
        await context.store?.put<WebhookInfo>('_video_generation_success_webhook', {
          endpoint_id: webhookData.data.endpoint_id,
        });
      }
    } catch (error) {
      console.error('Failed to register webhook:', error);
      throw new Error('Failed to register webhook with JoggAI');
    }
  },

  async onDisable(context) {
    try {
      const webhookInfo = await context.store?.get<WebhookInfo>('_video_generation_success_webhook');
      if (webhookInfo?.endpoint_id) {
        await httpClient.sendRequest({
          method: HttpMethod.DELETE,
          url: `https://api.jogg.ai/v1/webhook/endpoint/${webhookInfo.endpoint_id}`,
          headers: {
            'x-api-key': context.auth,
          },
        });
      }
    } catch (error) {
      console.error('Failed to unregister webhook:', error);
      // Don't throw error on disable to avoid issues
    }
  },

  async run(context) {
    const payload = context.payload.body as any;

    // Only process success events (additional safety check)
    if (payload.event === 'generated_video_success') {
      return [payload];
    }

    // If somehow we received a non-success event, return empty array
    return [];
  },
});
