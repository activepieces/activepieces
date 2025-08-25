import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const mollieNewRefund = createTrigger({
  auth: mollieAuth,
  name: 'new_refund',
  displayName: 'New Refund',
  description: 'Triggers when a refund status changes',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Store the webhook URL for reference
    await context.store?.put<WebhookInformation>('_mollie_refund_webhook', {
      webhookUrl: context.webhookUrl,
    });
  },
  async onDisable(context) {
    // Clean up stored webhook information
    await context.store?.delete('_mollie_refund_webhook');
  },
  async run(context) {
    const payloadBody = context.payload.body as PayloadBody;

    // Mollie sends the payment ID when a refund status changes
    if (payloadBody.id && payloadBody.id.startsWith('tr_')) {
      // Fetch the payment details to get refund information
      const payment = await mollieCommon.getResource(
        context.auth as string,
        'payments',
        payloadBody.id
      );

      // If there are refunds, fetch the latest one
      if (payment._links?.refunds) {
        const refunds = await mollieCommon.makeRequest(
          context.auth as string,
          HttpMethod.GET,
          `/payments/${payloadBody.id}/refunds`,
          undefined,
          { limit: 1 }
        );

        if (refunds._embedded?.refunds?.length > 0) {
          return [refunds._embedded.refunds[0]];
        }
      }
    }

    return [];
  },
  async test(context) {
    // Return sample data for testing
    return [mollieNewRefund.sampleData];
  },
  sampleData: {
    id: 're_4qqhO89gsT',
    amount: {
      value: '10.00',
      currency: 'EUR',
    },
    status: 'pending',
    createdAt: '2024-01-15T12:00:00+00:00',
    description: 'Order #12345 refund',
    metadata: {
      order_id: '12345',
    },
    paymentId: 'tr_WDqYK6vllg',
    settlementId: 'stl_jDk30akdN',
    settlementAmount: {
      value: '-10.00',
      currency: 'EUR',
    },
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/payments/tr_WDqYK6vllg/refunds/re_4qqhO89gsT',
        type: 'application/hal+json',
      },
      payment: {
        href: 'https://api.mollie.com/v2/payments/tr_WDqYK6vllg',
        type: 'application/hal+json',
      },
      settlement: {
        href: 'https://api.mollie.com/v2/settlements/stl_jDk30akdN',
        type: 'application/hal+json',
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
