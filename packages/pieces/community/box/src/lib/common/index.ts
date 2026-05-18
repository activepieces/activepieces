import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export interface WebhookInformation {
  id: string;
  target: string;
  type: string;
  address: string;
  created_at: string;
  created_by: string;
  triggers: string[];
}

export const common = {
  baseUrl: 'https://api.box.com/2.0',

  async subscribeWebhook(
    auth: OAuth2PropertyValue,
    data: {
      event: string;
      target: {
        id: number | string;
        type: string;
      };
      webhookUrl: string;
    }
  ) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${common.baseUrl}/webhooks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
      body: {
        address: data.webhookUrl,
        triggers: [data.event],
        target: data.target,
      },
    };

    const response = await httpClient.sendRequest<WebhookInformation>(request);
    return response.body;
  },

  async unsubscribeWebhook(auth: OAuth2PropertyValue, webhookId: string) {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${common.baseUrl}/webhooks/${webhookId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    };

    const response = await httpClient.sendRequest(request);
    return response;
  },
};
