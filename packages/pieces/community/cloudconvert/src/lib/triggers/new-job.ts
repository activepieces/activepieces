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

export const newJob = createTrigger({
  name: 'new_job',
  displayName: 'New Job Event',
  description: 'Triggers when a new job has been created',
  auth: cloudconvertAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    event: 'job.created',
    job: {
      id: '6559c281-ed85-4728-80db-414561c631e9',
      tag: 'myjob-123',
      status: 'waiting',
      created_at: '2018-09-19T14:42:58+00:00',
      started_at: null,
      ended_at: null,
      tasks: [
        {
          id: '7f110c42-3245-41cf-8555-37087c729ed2',
          name: 'import-my-file',
          operation: 'import/s3',
          status: 'waiting',
          created_at: '2018-09-19T14:42:58+00:00',
          started_at: null,
          ended_at: null
        },
        {
          id: '7a142bd0-fa20-493e-abf5-99cc9b5fd7e9',
          name: 'convert-my-file',
          operation: 'convert',
          status: 'waiting',
          created_at: '2018-09-19T14:42:58+00:00',
          started_at: null,
          ended_at: null,
          engine: 'office',
          engine_version: '2016'
        },
        {
          id: '36af6f54-1c01-45cc-bcc3-97dd23d2f93d',
          name: 'export-my-file',
          operation: 'export/s3',
          status: 'waiting',
          created_at: '2018-09-19T14:42:58+00:00',
          started_at: null,
          ended_at: null
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
        events: ['job.created']
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

    if (payload?.event === 'job.created' && payload?.job) {
      return [payload];
    }

    return [];
  },
});
