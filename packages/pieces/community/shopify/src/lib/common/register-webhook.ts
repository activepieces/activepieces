import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  createTrigger,
  Trigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';

export const createShopifyWebhookTrigger = ({
  name,
  description,
  displayName,
  sampleData,
  topic,
}: {
  name: string;
  description: string;
  displayName: string;
  topic: string;
  sampleData: Record<string, unknown>;
}): Trigger =>
  createTrigger({
    auth: shopifyAuth,
    name,
    description,
    displayName,
    props: {},
    sampleData: sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const shopName = context.auth.shopName;
      const response = await httpClient.sendRequest<{
        webhook: {
          id: string;
        };
      }>({
        method: HttpMethod.POST,
        url: `https://${shopName}.myshopify.com/admin/api/2023-01/webhooks.json`,
        headers: {
          'X-Shopify-Access-Token': context.auth.adminToken,
        },
        body: {
          webhook: {
            topic: topic,
            address: context.webhookUrl,
            format: 'json',
          },
        },
      });
      await context.store?.put(`shopify_webhook_id`, response.body.webhook.id);
      console.log('webhook created', response.body.webhook.id);
    },
    async onDisable(context) {
      const webhookId = await context.store.get<string>(`shopify_webhook_id`);
      const shopName = context.auth.shopName;
      await httpClient.sendRequest<{
        webhook: {
          id: string;
        };
      }>({
        method: HttpMethod.DELETE,
        url: `https://${shopName}.myshopify.com/admin/api/2023-01/webhooks/${webhookId}.json`,
        headers: {
          'X-Shopify-Access-Token': context.auth.adminToken,
        },
      });
      await context.store?.put(`shopify_webhook_id`, null);
    },
    async run(context) {
      console.debug('trigger running', context);
      return [context.payload.body];
    },
  });
