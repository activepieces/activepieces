import {
  PiecePropValueSchema,
  TriggerStrategy,
  WebhookHandshakeStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { wooAuth } from '../../';
import { WebhookInformation, wooCommon } from '../common';
export const woocommerceRegisterTrigger = ({
  name,
  topic,
  displayName,
  description,
  sampleData,
}: {
  name: string;
  topic: string;
  displayName: string;
  description: string;
  sampleData: unknown;
}) =>
  createTrigger({
    auth: wooAuth,
    name: `$woocommerce_trigger_${name}`,
    displayName,
    description,
    props: {},
    sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const res = await wooCommon.createWebhook(
        displayName,
        context.webhookUrl,
        topic,
        context.auth as PiecePropValueSchema<typeof wooAuth>
      );
      await context.store.put<WebhookInformation>(
        `$woocommerce_trigger_${name}`,
        res.body
      );
    },
    async onDisable(context) {
      const webhook = await context.store.get<WebhookInformation>(
        `$woocommerce_trigger_${name}`
      );
      if (webhook != null) {
        await wooCommon.deleteWebhook(
          webhook.id,
          context.auth as PiecePropValueSchema<typeof wooAuth>
        );
      }
    },
    // WooCommerce sends a request verifying the webhook that contains only the webhook_id.
    handshakeConfiguration: {
      strategy: WebhookHandshakeStrategy.BODY_PARAM_PRESENT,
      paramName: 'webhook_id',
    },
    async onHandshake(context) {
      return {
        status: 200,
        body: { webhook_id: (context.payload.body as any)['webhook_id'] },
      };
    },
    async run(context) {
      return [context.payload.body];
    },
  });
