import {
  createTrigger,
  TriggerStrategy,
} from '../../../framework/trigger/trigger';
import { stripeCommon } from '../common';

export const stripePaymentFailed = createTrigger({
  name: 'payment_failed',
  displayName: 'Payment Failed',
  description: 'Triggers when a payment fails',
  props: {
    api_key: stripeCommon.authentication
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook('charge.failed', context.webhookUrl!, context.propsValue['api_key']!);
    await context.store?.save<WebhookInformation>('_payment_failed_trigger', {
      webhookId: webhook.id
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>('_payment_failed_trigger');
    if (response !== null && response !== undefined) {
      const webhook = await stripeCommon.unsubscribeWebhook(response.webhookId, context.propsValue['api_key']!);
    }
  },
  async run(context) {
    return [context.payload.data.object];
  },
});

interface WebhookInformation {
  webhookId: string;
}
