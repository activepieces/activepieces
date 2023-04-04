import { createTrigger } from '@activepieces/framework';
import { TriggerStrategy } from '@activepieces/shared';
import { stripeCommon } from '../common';

export const stripeNewCustomer = createTrigger({
  name: 'new_customer',
  displayName: 'New Customer',
  description: 'Triggers when a new customer is created',
  props: {
    api_key: stripeCommon.authentication
  },
  sampleData: {
    "id": "cus_NGtyEf4hNGTj3p",
    "object": "customer",
    "address": null,
    "balance": 0,
    "created": 1675180509,
    "currency": null,
    "default_currency": null,
    "default_source": null,
    "delinquent": false,
    "description": null,
    "discount": null,
    "email": "jane@example.com",
    "invoice_prefix": "B7162248",
    "invoice_settings": {
      "custom_fields": null,
      "default_payment_method": null,
      "footer": null,
      "rendering_options": null
    },
    "livemode": false,
    "metadata": {},
    "name": "John Doe",
    "next_invoice_sequence": 1,
    "phone": null,
    "preferred_locales": [],
    "shipping": null,
    "tax_exempt": "none",
    "test_clock": null
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook('customer.created', context.webhookUrl!, context.propsValue['api_key']!);
    await context.store?.put<WebhookInformation>('_new_customer_trigger', {
      webhookId: webhook.id
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>('_new_customer_trigger');
    if (response !== null && response !== undefined) {
      await stripeCommon.unsubscribeWebhook(response.webhookId, context.propsValue['api_key']!);
    }
  },
  async run(context) {
    return [context.payload.body.data.object];
  },
});

interface WebhookInformation {
  webhookId: string;
}
