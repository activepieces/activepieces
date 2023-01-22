import {
  createTrigger,
  TriggerStrategy,
} from '../../../framework/trigger/trigger';
import { stripeCommon } from '../common';

export const stripeNewCustomer = createTrigger({
  name: 'new_customer',
  displayName: 'New Customer',
  description: 'Triggers when a new customer is created',
  props: {
    api_key: stripeCommon.authentication
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook('customer.created', context.webhookUrl!, context.propsValue['api_key']!);
    await context.store?.save<WebhookInformation>('_new_customer_trigger', {
      webhookId: webhook.id
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>('_new_customer_trigger');
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
