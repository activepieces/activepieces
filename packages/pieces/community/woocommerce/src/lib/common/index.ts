import {
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

import axios from 'axios';
import https from 'https';

export const wooCommon = {
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
    webhookUrl: string,
    type: string,
    authentication: any
  ) {
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
  },
};
