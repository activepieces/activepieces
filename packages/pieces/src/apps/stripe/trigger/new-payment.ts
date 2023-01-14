import {
  createTrigger,
  TriggerStrategy,
} from '../../../framework/trigger/trigger';
import { Property } from '../../../framework/property';
import { stripeCommon } from '../common';

export const stripeNewPayment = createTrigger({
  name: 'new_payment',
  displayName: 'New Payment',
  description: 'Triggers when a new payment is made',
  props: {
    api_key: Property.ShortText({
			displayName: 'API Key',
			description: undefined,
			required: true,
		})
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook('charge.succeeded', context.webhookUrl!, context.propsValue['api_key']!);
    await context.store?.save<WebhookInformation>('_new_payment_trigger', {
      webhookId: webhook.id
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>('_new_payment_trigger');
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
