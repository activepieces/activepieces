import {
  HttpMethod,
  HttpRequest,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { cloudconvertAuth, cloudconvertCommon } from '../common';

export const jobFailed = createTrigger({
  name: 'job_failed',
  displayName: 'Job Failed',
  description: 'Triggers when a CloudConvert job has failed',
  auth: cloudconvertAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    event: 'job.failed',
    job: {
      id: 'job_123456789',
      tag: 'example-job',
      status: 'error',
      created_at: '2023-12-01T12:00:00Z',
      started_at: '2023-12-01T12:00:05Z',
      ended_at: '2023-12-01T12:00:15Z',
      message: 'Task failed: File conversion error',
      code: 'CONVERSION_FAILED',
      tasks: [
        {
          id: 'task_123456789',
          name: 'convert-my-file',
          operation: 'convert',
          status: 'error',
          message: 'File conversion error',
          code: 'CONVERSION_FAILED',
          created_at: '2023-12-01T12:00:00Z',
          started_at: '2023-12-01T12:00:05Z',
          ended_at: '2023-12-01T12:00:15Z',
          engine: 'office',
          engine_version: '2016',
          result: null
        }
      ]
    }
  },

  async test(context) {
    return [this.sampleData];
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${cloudconvertCommon.baseUrl((context.auth as any).region || 'auto')}/webhooks`,
      body: {
        url: webhookUrl,
        events: ['job.failed']
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await httpClient.sendRequest(request);
    if (response.status !== 201) {
      throw new Error(`Failed to register webhook. Status: ${response.status}`);
    }
  },

  onDisable: async (context) => {
    const webhookUrl = context.webhookUrl;

    // First, find the webhook by URL
    const listRequest: HttpRequest = {
      method: HttpMethod.GET,
      url: `${cloudconvertCommon.baseUrl((context.auth as any).region || 'auto')}/users/me/webhooks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    };

    try {
      const listResponse = await httpClient.sendRequest(listRequest);
      if (listResponse.status === 200 && listResponse.body.data) {
        const webhook = listResponse.body.data.find((w: any) => w.url === webhookUrl);
        if (webhook) {
          const deleteRequest: HttpRequest = {
            method: HttpMethod.DELETE,
            url: `${cloudconvertCommon.baseUrl((context.auth as any).region || 'auto')}/webhooks/${webhook.id}`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: context.auth.access_token,
            },
          };
          await httpClient.sendRequest(deleteRequest);
        }
      }
    } catch (error) {
      // Continue silently
    }
  },

  run: async (context) => {
    const payload = context.payload.body as any;

    if (payload?.event === 'job.failed' && payload?.job) {
      return [payload];
    }

    return [];
  },
});