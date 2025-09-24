import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { StripeWebhookInformation } from '../common/types';
import { stripeAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isEmpty } from '@activepieces/shared';

type StripeWebhookPayload = {
  data: {
    object: unknown;
  };
};

export const stripeNewCharge = createTrigger({
  auth: stripeAuth,
  name: 'new_charge',
  displayName: 'New Charge',
  description: 'Fires when a charge is successfully completed.',
  props: {},
  sampleData: {
    id: 'ch_3MmlLrLkdIwHu7ix0snN0B15',
    object: 'charge',
    amount: 1099,
    amount_captured: 1099,
    amount_refunded: 0,
    application: null,
    application_fee: null,
    application_fee_amount: null,
    balance_transaction: 'txn_3MmlLrLkdIwHu7ix0uke3Ezy',
    billing_details: {
      address: {
        city: null,
        country: null,
        line1: null,
        line2: null,
        postal_code: null,
        state: null,
      },
      email: 'customer@example.com',
      name: 'John Doe',
      phone: null,
    },
    captured: true,
    created: 1679090539,
    currency: 'usd',
    customer: 'cus_ABC123',
    description: 'My First Test Charge',
    disputed: false,
    paid: true,
    payment_intent: 'pi_123',
    payment_method: 'pm_123',
    receipt_url: 'https://pay.stripe.com/receipts/...',
    refunded: false,
    status: 'succeeded',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook(
      'charge.succeeded',
      context.webhookUrl,
      context.auth
    );
    await context.store.put<StripeWebhookInformation>('_new_charge_trigger', {
      webhookId: webhook.id,
    });
  },

  async onDisable(context) {
    const webhookInfo = await context.store.get<StripeWebhookInformation>(
      '_new_charge_trigger'
    );
    if (webhookInfo !== null && webhookInfo !== undefined) {
      await stripeCommon.unsubscribeWebhook(
        webhookInfo.webhookId,
        context.auth
      );
    }
  },
  async test(context) {
    const response = await httpClient.sendRequest<{ data: { id: string }[] }>({
      method: HttpMethod.GET,
      url: 'https://api.stripe.com/v1/checkout/charges',
      headers: {
        Authorization: 'Bearer ' + context.auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      queryParams: {
        limit: '5',
      },
    });

    if (isEmpty(response.body) || isEmpty(response.body.data)) return [];

    return response.body.data;
  },
  async run(context) {
    const payloadBody = context.payload.body as StripeWebhookPayload;
    return [payloadBody.data.object];
  },
});
