import { createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isEmpty } from '@activepieces/pieces-framework';

import { paymentIntentOutputSchema } from '../output-schemas';
export const stripeNewPayment = createTrigger({
  auth: stripeAuth,
  name: 'new_payment',
  displayName: 'New Payment',
  description: 'Triggers when a new payment is made',
  aiMetadata: {
    description:
      'Fires when a payment succeeds in Stripe (the payment_intent.succeeded event), emitting the completed payment. Use to react to a successful payment, such as fulfilling an order or recording revenue.',
  },
  props: {},
  type: TriggerStrategy.WEBHOOK,
  outputSchema: paymentIntentOutputSchema,
  sampleData: {
    id: 'pi_3MWM7aKZ0dZRqLEK1soCKVrq',
    object: 'payment_intent',
    amount: 10000,
    amount_capturable: 0,
    amount_received: 10000,
    capture_method: 'automatic_async',
    confirmation_method: 'automatic',
    created: 1675180355,
    currency: 'usd',
    customer: 'cus_NGtvUQ18FJXcGI',
    description: 'Subscription creation',
    latest_charge: 'ch_3MWM7aKZ0dZRqLEK1soCKVrq',
    livemode: false,
    metadata: {},
    payment_method: 'pm_1MWM8MKZ0dZRqLEKnIH41f76',
    receipt_email: null,
    setup_future_usage: null,
    status: 'succeeded',
  },
  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook(
      'payment_intent.succeeded',
      context.webhookUrl!,
      context.auth.secret_text
    );
    await context.store?.put<WebhookInformation>('_new_payment_trigger', {
      webhookId: webhook.id,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_new_payment_trigger'
    );
    if (response !== null && response !== undefined) {
      await stripeCommon.unsubscribeWebhook(
        response.webhookId,
        context.auth.secret_text
      );
    }
  },
  async test(context) {
    const response = await httpClient.sendRequest<{ data: { id: string }[] }>({
      method: HttpMethod.GET,
      url: 'https://api.stripe.com/v1/payment_intents/search',
      headers: {
        Authorization: 'Bearer ' + context.auth.secret_text,
        'Content-Type': 'application/x-www-form-urlencoded',
         'Stripe-Version': "2026-02-25.clover",
      },
      queryParams: {
        query: 'status:"succeeded"',
        limit: '5',
      },
    });

    if (isEmpty(response.body) || isEmpty(response.body.data)) return [];

    return response.body.data;
  },
  async run(context) {
    const payloadBody = context.payload.body as PayloadBody;
    return [payloadBody.data.object];
  },
});

type PayloadBody = {
  data: {
    object: unknown;
  };
};

interface WebhookInformation {
  webhookId: string;
}
