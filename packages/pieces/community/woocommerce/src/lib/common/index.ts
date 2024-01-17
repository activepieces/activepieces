import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { wooAuth } from '../../';

export const wooCommon = {
  async createWebhook(
    name: string,
    webhookUrl: string,
    topic: string,
    auth: PiecePropValueSchema<typeof wooAuth>
  ) {
    const trimmedBaseUrl = auth.baseUrl.replace(/\/$/, '');
    return await httpClient.sendRequest<WebhookInformation>({
      url: `${trimmedBaseUrl}/wp-json/wc/v3/webhooks`,
      method: HttpMethod.POST,
      body: {
        name: name,
        topic: topic,
        delivery_url: webhookUrl,
      },
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.consumerKey,
        password: auth.consumerSecret,
      },
    });
  },
  async deleteWebhook(
    webhookId: number,
    auth: PiecePropValueSchema<typeof wooAuth>
  ) {
    const trimmedBaseUrl = auth.baseUrl.replace(/\/$/, '');
    return await httpClient.sendRequest({
      url: `${trimmedBaseUrl}/wp-json/wc/v3/webhooks/${webhookId}`,
      method: HttpMethod.DELETE,
      queryParams: { force: 'true' },
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.consumerKey,
        password: auth.consumerSecret,
      },
    });
  },
};

export interface WebhookInformation {
  id: number;
  name: string;
  status: string;
  topic: string;
  resource: string;
  event: string;
  hooks: string[];
  delivery_url: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
}
