import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../..';

interface WebhookInfo {
  endpoint_id: string;
}

export const videoGenerationFailed = createTrigger({
  name: 'videoGenerationFailed',
  displayName: 'Video Generation Failed',
  description: 'Fires when video generation fails',
  auth: joggAiAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},

  sampleData: {
    event_id: 'evt_123456789',
    event: 'generated_video_failed',
    timestamp: 1703894400,
    data: {
      project_id: 'abc123',
      error: {
        message: 'Video generation failed due to invalid parameters',
      },
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
          events: ['generated_video_failed'],
          status: 'enabled',
        },
      });

      const webhookData = response.body;
      if (webhookData.data?.endpoint_id) {
        await context.store?.put<WebhookInfo>('_video_generation_failed_webhook', {
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
      const webhookInfo = await context.store?.get<WebhookInfo>('_video_generation_failed_webhook');
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

    // Only process failure events (additional safety check)
    if (payload.event === 'generated_video_failed') {
      return [payload];
    }

    // If somehow we received a non-failure event, return empty array
    return [];
  },
});
