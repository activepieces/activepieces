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

export const jobFinished = createTrigger({
  name: 'job_finished',
  displayName: 'Job Finished',
  description: 'Triggers when a CloudConvert job has been completed',
  auth: cloudconvertAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    event: 'job.finished',
    job: {
      id: '6559c281-ed85-4728-80db-414561c631e9',
      tag: 'myjob-123',
      status: 'finished',
      created_at: '2018-09-19T14:42:58+00:00',
      started_at: '2018-09-19T14:42:58+00:00',
      ended_at: '2018-09-19T14:43:08+00:00',
      tasks: [
        {
          id: '1f34c1b5-9ee8-4c8c-890f-bf44cda1deb7',
          name: 'import-my-file',
          operation: 'import/url',
          status: 'finished',
          created_at: '2018-09-19T14:42:58+00:00',
          started_at: '2018-09-19T14:42:58+00:00',
          ended_at: '2018-09-19T14:42:59+00:00',
          result: {
            files: [
              {
                filename: 'input.pdf',
                size: 10240
              }
            ]
          }
        },
        {
          id: '48c6e72b-cb8e-4ecc-bf3d-ead5477b4741',
          name: 'convert-my-file',
          operation: 'convert',
          status: 'finished',
          created_at: '2018-09-19T14:42:58+00:00',
          started_at: '2018-09-19T14:42:59+00:00',
          ended_at: '2018-09-19T14:43:08+00:00',
          engine: 'office',
          engine_version: '2016',
          result: {
            files: [
              {
                filename: 'output.docx',
                url: 'https://storage.cloudconvert.com/48c6e72b-cb8e-4ecc-bf3d-ead5477b4741/output.docx',
                size: 15360
              }
            ]
          }
        },
        {
          id: '36af6f54-1c01-45cc-bcc3-97dd23d2f93d',
          name: 'export-my-file',
          operation: 'export/url',
          status: 'finished',
          created_at: '2018-09-19T14:42:58+00:00',
          started_at: '2018-09-19T14:43:08+00:00',
          ended_at: '2018-09-19T14:43:08+00:00',
          result: {
            files: [
              {
                filename: 'output.docx',
                url: 'https://storage.cloudconvert.com/36af6f54-1c01-45cc-bcc3-97dd23d2f93d/output.docx',
                size: 15360
              }
            ]
          }
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
        events: ['job.finished']
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

    if (payload?.event === 'job.finished' && payload?.job) {
      return [payload];
    }

    return [];
  },
});
