import { createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isEmpty } from '@activepieces/shared';

export const stripePaymentFailed = createTrigger({
  auth: stripeAuth,
  name: 'payment_failed',
  displayName: 'Payment Failed',
  description: 'Triggers when a payment fails',
  props: {},
  sampleData: {
    id: 'ch_3MWMPQKZ0dZRqLEK063rxD7q',
    object: 'charge',
    amount: 100000,
    amount_captured: 0,
    amount_refunded: 0,
    application: null,
    application_fee: null,
    application_fee_amount: null,
    balance_transaction: null,
    billing_details: {
      address: {
        city: null,
        country: null,
        line1: null,
        line2: null,
        postal_code: '12321',
        state: null,
      },
      email: null,
      name: null,
      phone: null,
    },
    calculated_statement_descriptor: 'WWW.ACTIVEPIECES.COM',
    captured: false,
    created: 1675181413,
    currency: 'usd',
    customer: 'cus_NGtvUQ18FJXcGI',
    description: 'Failed Payment',
    destination: null,
    dispute: null,
    disputed: false,
    failure_balance_transaction: null,
    failure_code: 'card_declined',
    failure_message: 'Your card was declined.',
    fraud_details: {},
    invoice: null,
    livemode: false,
    metadata: {},
    on_behalf_of: null,
    order: null,
    outcome: {
      network_status: 'declined_by_network',
      reason: 'generic_decline',
      risk_level: 'normal',
      risk_score: 60,
      seller_message:
        'The bank did not return any further details with this decline.',
      type: 'issuer_declined',
    },
    paid: false,
    payment_intent: 'pi_3MWMPQKZ0dZRqLEK0Nsc6WhL',
    payment_method: 'src_1MWMPQKZ0dZRqLEKuQ83wmZI',
    payment_method_details: {
      card: {
        brand: 'visa',
        checks: {
          address_line1_check: null,
          address_postal_code_check: 'pass',
          cvc_check: 'pass',
        },
        country: 'US',
        exp_month: 12,
        exp_year: 2031,
        fingerprint: 'mtYxM2Q4edpEt8Pw',
        funding: 'credit',
        installments: null,
        last4: '0341',
        mandate: null,
        network: 'visa',
        three_d_secure: null,
        wallet: null,
      },
      type: 'card',
    },
    receipt_email: null,
    receipt_number: null,
    receipt_url: null,
    refunded: false,
    refunds: {
      object: 'list',
      data: [],
      has_more: false,
      total_count: 0,
      url: '/v1/charges/ch_3MWMPQKZ0dZRqLEK063rxD7q/refunds',
    },
    review: null,
    shipping: null,
    source: {
      id: 'src_1MWMPQKZ0dZRqLEKuQ83wmZI',
      object: 'source',
      amount: null,
      card: {
        exp_month: 12,
        exp_year: 2031,
        last4: '0341',
        country: 'US',
        brand: 'Visa',
        address_zip_check: 'pass',
        cvc_check: 'pass',
        funding: 'credit',
        fingerprint: 'mtYxM2Q4edpEt8Pw',
        three_d_secure: 'optional',
        name: null,
        address_line1_check: null,
        tokenization_method: null,
        dynamic_last4: null,
      },
      client_secret: 'src_client_secret_TlLkl6IvhCvmbx8Cz12YNDVb',
      created: 1675181413,
      currency: null,
      flow: 'none',
      livemode: false,
      metadata: {},
      owner: {
        address: {
          city: null,
          country: null,
          line1: null,
          line2: null,
          postal_code: '12321',
          state: null,
        },
        email: null,
        name: null,
        phone: null,
        verified_address: null,
        verified_email: null,
        verified_name: null,
        verified_phone: null,
      },
      statement_descriptor: null,
      status: 'chargeable',
      type: 'card',
      usage: 'reusable',
    },
    source_transfer: null,
    statement_descriptor: 'www.activepieces.com',
    statement_descriptor_suffix: null,
    status: 'failed',
    transfer_data: null,
    transfer_group: null,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook(
      'charge.failed',
      context.webhookUrl,
      context.auth
    );
    await context.store?.put<WebhookInformation>('_payment_failed_trigger', {
      webhookId: webhook.id,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_payment_failed_trigger'
    );
    if (response !== null && response !== undefined) {
      await stripeCommon.unsubscribeWebhook(response.webhookId, context.auth);
    }
  },
  async test(context) {
    const response = await httpClient.sendRequest<{ data: { id: string }[] }>({
      method: HttpMethod.GET,
      url: 'https://api.stripe.com/v1/charges',
      headers: {
        Authorization: 'Bearer ' + context.auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      queryParams: {
        status: 'failed',
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
