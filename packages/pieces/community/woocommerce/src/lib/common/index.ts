import {
  AuthenticationType,
  HttpMethod,
  httpClient,
<<<<<<< HEAD:packages/pieces/community/woocommerce/src/lib/common/index.ts
  AuthenticationType,
=======
>>>>>>> origin/main:packages/pieces/woocommerce/src/lib/common/index.ts
} from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { wooAuth } from '../../';

export const wooCommon = {
<<<<<<< HEAD:packages/pieces/community/woocommerce/src/lib/common/index.ts
  /**
   * Creates a WooCommerce webhook creation object for the request body.
   * @param type The topic type to listen for (Customer, Order, Product, Coupon).
   * @param webhookUrl The endpoint to send the webhook to.
   * @param action The action on the topic to listen for (created, updated, deleted).
   * @returns The created object.
   */
  createWebhookObject(type: string, webhookUrl: string, action: string) {
    return {
      name: `${type} ${action}`,
      topic: `${type.toLowerCase()}.${action}`,
      delivery_url: webhookUrl,
    };
  },

  /**
   * For running on localhost with self-signed certificate
   */
  axiosClient: axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
  }),

  async subscribeWebhook(
=======
  async createWebhook(
    name: string,
>>>>>>> origin/main:packages/pieces/woocommerce/src/lib/common/index.ts
    webhookUrl: string,
    topic: string,
    auth: PiecePropValueSchema<typeof wooAuth>
  ) {
<<<<<<< HEAD:packages/pieces/community/woocommerce/src/lib/common/index.ts
    let webhookIds: number[] = [];
    const actions = ['created', 'updated', 'deleted'];

    webhookIds = await Promise.all(
      actions.map((action: string) => {
        return new Promise<number>((resolve) => {
          /**
           * For running on localhost with self-signed certificate
           */
          // const webhookId = (await this.axiosClient.post(`${authentication.baseUrl}/wp-json/wc/v3/webhooks`, this.createWebhookObject(type, webhookUrl, action), {
          //     auth: {
          //         username: authentication.consumerKey,
          //         password: authentication.consumerSecret
          //     }
          // })).data.id;

          /**
           * For production use
           */
          // Remove trailing slash if present
          const trimmedBaseUrl = authentication.baseUrl.replace(/\/$/, '');
          httpClient
            .sendRequest({
              url: `${trimmedBaseUrl}/wp-json/wc/v3/webhooks`,
              method: HttpMethod.POST,
              body: this.createWebhookObject(type, webhookUrl, action),
              authentication: {
                type: AuthenticationType.BASIC,
                username: authentication.consumerKey,
                password: authentication.consumerSecret,
              },
            })
            .then((response) => {
              resolve(response.body.id);
            });
        });
      })
    );

    return webhookIds;
  },

  async unsubscribeWebhook(webhookId: number, authentication: any) {
    /**
     * For running on localhost with self-signed certificate
     */
    // const req = await this.axiosClient.delete(`${authentication.baseUrl}/wp-json/wc/v3/webhooks/${webhookId}`, {
    //     auth: {
    //         username: authentication.consumerKey,
    //         password: authentication.consumerSecret
    //     }
    // })

    // return req.data;

    /**
     * For production use
     */
    // Remove trailing slash if present
    const trimmedBaseUrl = authentication.baseUrl.replace(/\/$/, '');
    const req = await httpClient.sendRequest({
      url: `${trimmedBaseUrl}/wp-json/wc/v3/webhooks/${webhookId}`,
      method: HttpMethod.DELETE,
      authentication: {
        type: AuthenticationType.BASIC,
        username: authentication.consumerKey,
        password: authentication.consumerSecret,
      },
    });

    return req.body;
=======
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
>>>>>>> origin/main:packages/pieces/woocommerce/src/lib/common/index.ts
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
