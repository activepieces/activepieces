import { Property } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, httpClient, AuthenticationType } from "@activepieces/pieces-common";

import axios from 'axios';
import https from 'https';

const authDescription = `
To generate your API credentials, follow the steps below:
1. Go to WooCommerce -> Settings -> Advanced tab -> REST API.
2. Click on Add Key to create a new key.
3. Enter the key description and change the permissions to Read/Write.
4. Click Generate Key.
5. Copy the Consumer Key and Consumer Secret into the fields below. You will not be able to view the Consumer Secret after exiting the page.

Note that the base URL of your WooCommerce instance needs to be on a secure (HTTPS) connection, or the piece will not work even on local instances on the same device.
`;

export const wooCommon = {
    authentication: Property.CustomAuth({
        displayName: 'Authentication',
        description: authDescription,
        required: true,
        props: {
            baseUrl: Property.ShortText({
                displayName: 'Base URL',
                description: 'The base URL of your app without trailing slash (e.g https://mystore.com, not https://mystore.com/) - HTTPS only',
                required: true,
            }),
            consumerKey: Property.ShortText({
                displayName: 'Consumer Key',
                description: 'The consumer key generated from your app',
                required: true,
            }),
            consumerSecret: Property.SecretText({
                displayName: 'Consumer Secret',
                description: 'The consumer secret generated from your app',
                required: true,
            })
        }
    }),

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
            delivery_url: webhookUrl
        }
    },

    /**
     * For running on localhost with self-signed certificate
     */
    axiosClient: axios.create({
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }),

    async subscribeWebhook(webhookUrl: string, type: string, authentication: any) {
        let webhookIds: number[] = [];
        const actions = ['created', 'updated', 'deleted'];

        webhookIds = await Promise.all(actions.map((action: string) => {
            return new Promise<number>(async (resolve) => {
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
                const webhookId = (await httpClient.sendRequest({
                    url: `${authentication.baseUrl}/wp-json/wc/v3/webhooks`,
                    method: HttpMethod.POST,
                    body: this.createWebhookObject(type, webhookUrl, action),
                    authentication: {
                        type: AuthenticationType.BASIC,
                        username: authentication.consumerKey,
                        password: authentication.consumerSecret
                    }
                })).body.id;

                resolve(webhookId)
            });
        }));

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
        const req = await httpClient.sendRequest({
            url: `${authentication.baseUrl}/wp-json/wc/v3/webhooks/${webhookId}`,
            method: HttpMethod.DELETE,
            authentication: {
                type: AuthenticationType.BASIC,
                username: authentication.consumerKey,
                password: authentication.consumerSecret
            }
        })

        return req.body;
    }
}