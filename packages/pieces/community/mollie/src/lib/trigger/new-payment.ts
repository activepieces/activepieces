import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon } from '../common';

export const mollieNewPayment = createTrigger({
  auth: mollieAuth,
  name: 'new_payment',
  displayName: 'New Payment',
  description: 'Triggers when a payment status changes',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Store the webhook URL for reference
    await context.store?.put<WebhookInformation>('_mollie_payment_webhook', {
      webhookUrl: context.webhookUrl,
    });
  },
  async onDisable(context) {
    // Clean up stored webhook information
    await context.store?.delete('_mollie_payment_webhook');
  },
  async run(context) {
    const payloadBody = context.payload.body as PayloadBody;

    // Mollie sends a POST with 'id' parameter containing the payment ID
    if (payloadBody.id && payloadBody.id.startsWith('tr_')) {
      // Fetch the full payment details using the ID
      const payment = await mollieCommon.getResource(
        context.auth as string,
        'payments',
        payloadBody.id
      );
      return [payment];
    }

    return [];
  },
  async test(context) {
    // Return sample data for testing
    return [mollieNewPayment.sampleData];
  },
  sampleData: {
    id: 'tr_WDqYK6vllg',
    mode: 'test',
    createdAt: '2024-01-15T12:00:00+00:00',
    amount: {
      value: '10.00',
      currency: 'EUR',
    },
    description: 'Order #12345',
    method: 'ideal',
    metadata: {
      order_id: '12345',
    },
    status: 'paid',
    isCancelable: false,
    expiresAt: '2024-01-15T12:15:00+00:00',
    profileId: 'pfl_QkEhN94Ba',
    sequenceType: 'oneoff',
    redirectUrl: 'https://example.com/redirect',
    webhookUrl: 'https://example.com/webhook',
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/payments/tr_WDqYK6vllg',
        type: 'application/hal+json',
      },
      checkout: {
        href: 'https://checkout.mollie.com/pay/tr_WDqYK6vllg',
        type: 'text/html',
      },
      dashboard: {
        href: 'https://www.mollie.com/dashboard/org_12345678/payments/tr_WDqYK6vllg',
        type: 'text/html',
      },
    },
  },
});

type PayloadBody = {
  id: string;
};

interface WebhookInformation {
  webhookUrl: string;
}
