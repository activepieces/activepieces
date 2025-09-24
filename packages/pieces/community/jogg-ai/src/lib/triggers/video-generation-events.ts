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

      if (response.body.code && response.body.code !== 0) {
        const errorMessages: Record<number, string> = {
          10104: 'Record not found',
          10105: 'Invalid API key',
          18020: 'Insufficient credit',
          18025: 'No permission to call APIs',
          40000: 'Parameter error',
          50000: 'System error',
        };

        const message =
          errorMessages[response.body.code] ||
          `API Error: ${response.body.msg}`;
        throw new Error(message);
      }

      const webhookData = response.body;
      if (webhookData.endpoint_id) {
        await context.store?.put<WebhookInfo>(
          '_video_generation_success_webhook',
          {
            endpoint_id: webhookData.endpoint_id,
          }
        );
      } else {
        throw new Error('Failed to get webhook endpoint ID from response');
      }
    } catch (error) {
      console.error('Failed to register webhook:', error);
      throw new Error(
        `Failed to register webhook with JoggAI: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  },

  async onDisable(context) {
    try {
      const webhookInfo = await context.store?.get<WebhookInfo>(
        '_video_generation_success_webhook'
      );
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
    }
  },

  async run(context) {
    const payload = context.payload.body as {
      event_id: string;
      event: string;
      timestamp: number;
      data: {
        project_id: string;
        video_url?: string;
        duration?: number;
      };
    };

    if (
      !payload.event_id ||
      !payload.event ||
      !payload.timestamp ||
      !payload.data?.project_id
    ) {
      console.warn('Invalid webhook payload received:', payload);
      return [];
    }

    if (payload.event === 'generated_video_success') {
      return [payload];
    }

    return [];
  },
});
