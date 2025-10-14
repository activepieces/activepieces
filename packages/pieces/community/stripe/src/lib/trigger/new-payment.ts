import { createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isEmpty } from '@activepieces/shared';

export const stripeNewPayment = createTrigger({
  auth: stripeAuth,
  name: 'new_payment',
  displayName: 'New Payment',
  description: 'Triggers when a new payment is made',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'ch_3MWM7aKZ0dZRqLEK1soCKVrq',
    object: 'charge',
    amount: 10000,
    amount_captured: 10000,
    amount_refunded: 0,
    application: null,
    application_fee: null,
    application_fee_amount: null,
    balance_transaction: 'txn_3MWM7aKZ0dZRqLEK1VyE8QH1',
    billing_details: {
      address: {
        city: null,
        country: 'DE',
        line1: null,
        line2: null,
        postal_code: null,
        state: null,
      },
      email: 'test@gmail.com',
      name: 'Test user',
      phone: null,
    },
    calculated_statement_descriptor: 'WWW.ACTIVEPIECES.COM',
    captured: true,
    created: 1675180355,
    currency: 'usd',
    customer: 'cus_NGtvUQ18FJXcGI',
    description: 'Subscription creation',
    destination: null,
    dispute: null,
    disputed: false,
    failure_balance_transaction: null,
    failure_code: null,
    failure_message: null,
    fraud_details: {},
    invoice: 'in_1MWM7ZKZ0dZRqLEKQbrgSBnh',
    livemode: false,
    metadata: {},
    on_behalf_of: null,
    order: null,
    outcome: {
      network_status: 'approved_by_network',
      reason: null,
      risk_level: 'normal',
      risk_score: 64,
      seller_message: 'Payment complete.',
      type: 'authorized',
    },
    paid: true,
    payment_intent: 'pi_3MWM7aKZ0dZRqLEK1BsblcVI',
    payment_method: 'pm_1MWM8MKZ0dZRqLEKnIH41f76',
    payment_method_details: {
      card: {
        brand: 'visa',
        checks: {
          address_line1_check: null,
          address_postal_code_check: null,
          cvc_check: 'pass',
        },
        country: 'US',
        exp_month: 12,
        exp_year: 2034,
        fingerprint: 't8SMsmS4h2vvODpN',
        funding: 'credit',
        installments: null,
        last4: '4242',
        mandate: null,
        network: 'visa',
        three_d_secure: null,
        wallet: null,
      },
      type: 'card',
    },
    receipt_email: null,
    receipt_number: null,
    receipt_url:
      'https://pay.stripe.com/receipts/invoices/CAcaFwoVYWNjdF8xS214ZEtLWjBkWlJxTEVLKMXy5J4GMgZcuppYWF06LBZEoiAhZ6H7EoJ3bN-BMHCXdaW-_i-ywhSIG9wPGTmtE0CdpD75s1hIyprK?s=ap',
    refunded: false,
    refunds: {
      object: 'list',
      data: [],
      has_more: false,
      total_count: 0,
      url: '/v1/charges/ch_3MWM7aKZ0dZRqLEK1soCKVrq/refunds',
    },
    review: null,
    shipping: null,
    source: null,
    source_transfer: null,
    statement_descriptor: null,
    statement_descriptor_suffix: null,
    status: 'succeeded',
    transfer_data: null,
    transfer_group: null,
  },
  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook(
      'charge.succeeded',
      context.webhookUrl!,
      context.auth
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
      await stripeCommon.unsubscribeWebhook(response.webhookId, context.auth);
    }
  },
  async test(context) {
    const response = await httpClient.sendRequest<{ data: { id: string }[] }>({
      method: HttpMethod.GET,
      url: 'https://api.stripe.com/v1/checkout/payment_intents',
      headers: {
        Authorization: 'Bearer ' + context.auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      queryParams: {
        status: 'succeeded',
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
