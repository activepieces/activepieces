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
          '_video_generation_failed_webhook',
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
        '_video_generation_failed_webhook'
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
        error: {
          message: string;
        };
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

    if (payload.event === 'generated_video_failed') {
      return [payload];
    }

    return [];
  },
});
