import { productboardAuth } from '../common/auth';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { productboardCommon } from '../common/client';

export const updatedFeature = createTrigger({
  name: 'updated_feature',
  displayName: 'Updated Feature',
  description: 'Triggers when an existing feature is updated in Productboard',
  auth: productboardAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 'feature-123',
    name: 'Updated Feature Name',
    description: 'Updated feature description',
    status: 'in_progress',
    type: 'feature',
    priority: 'high',
    created_at: '2023-12-01T10:00:00Z',
    updated_at: '2023-12-02T15:30:00Z'
  },
  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${productboardCommon.baseUrl}/webhooks`,
      body: {
        notification: {
          url: webhookUrl
        },
        events: ['feature.updated']
      },
      headers: {
        'X-API-Key': context.auth,
        'Content-Type': 'application/json',
      },
    };

    try {
      const { status, body } = await httpClient.sendRequest(request);
      if (status !== 201 && status !== 200) {
        throw new Error(`Failed to register webhook. Status: ${status}, Response: ${JSON.stringify(body)}`);
      }
      return body;
    } catch (error) {
      throw new Error(`Webhook registration failed: ${error}`);
    }
  },
  onDisable: async (context) => {
    const webhookUrl = context.webhookUrl;

    try {
      const getWebhooksRequest: HttpRequest = {
        method: HttpMethod.GET,
        url: `${productboardCommon.baseUrl}/webhooks`,
        headers: {
          'X-API-Key': context.auth,
        },
      };

      const { body: webhooks } = await httpClient.sendRequest(getWebhooksRequest);

      const webhook = webhooks.data?.find((wh: any) => wh.url === webhookUrl);

      if (webhook) {
        const deleteRequest: HttpRequest = {
          method: HttpMethod.DELETE,
          url: `${productboardCommon.baseUrl}/webhooks/${webhook.id}`,
          headers: {
            'X-API-Key': context.auth,
          },
        };

        await httpClient.sendRequest(deleteRequest);
      }
    } catch (error) {
      console.warn('Failed to unregister webhook:', error);
    }
  },
  run: async (context) => {
    const payload = context.payload.body as any;

    if (payload?.data?.id) {
      try {
        const featureDetails = await productboardCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.GET,
          resourceUri: `/features/${payload.data.id}`
        });

        return [featureDetails.body.data];
      } catch (error) {
        return [payload.data];
      }
    }

    return [payload];
  },
});
