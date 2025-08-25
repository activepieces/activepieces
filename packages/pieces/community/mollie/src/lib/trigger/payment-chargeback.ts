import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const molliePaymentChargeback = createTrigger({
  auth: mollieAuth,
  name: 'payment_chargeback',
  displayName: 'Payment Chargeback',
  description: 'Triggers when a payment receives a chargeback',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Store the webhook URL for reference
    await context.store?.put<WebhookInformation>('_mollie_chargeback_webhook', {
      webhookUrl: context.webhookUrl,
    });
  },
  async onDisable(context) {
    // Clean up stored webhook information
    await context.store?.delete('_mollie_chargeback_webhook');
  },
  async run(context) {
    const payloadBody = context.payload.body as PayloadBody;

    // Mollie sends the payment ID when a chargeback occurs
    if (payloadBody.id && payloadBody.id.startsWith('tr_')) {
      // Fetch the payment details to get chargeback information
      const payment = await mollieCommon.getResource(
        context.auth as string,
        'payments',
        payloadBody.id
      );

      // If there are chargebacks, fetch the latest one
      if (payment._links?.chargebacks) {
        const chargebacks = await mollieCommon.makeRequest(
          context.auth as string,
          HttpMethod.GET,
          `/payments/${payloadBody.id}/chargebacks`,
          undefined,
          { limit: 1 }
        );

        if (chargebacks._embedded?.chargebacks?.length > 0) {
          return [chargebacks._embedded.chargebacks[0]];
        }
      }
    }

    return [];
  },
  async test(context) {
    // Return sample data for testing
    return [molliePaymentChargeback.sampleData];
  },
  sampleData: {
    id: 'chb_n9z0tp',
    amount: {
      value: '10.00',
      currency: 'EUR',
    },
    settlementAmount: {
      value: '-10.00',
      currency: 'EUR',
    },
    createdAt: '2024-01-15T12:00:00+00:00',
    reversedAt: null,
    paymentId: 'tr_WDqYK6vllg',
    settlementId: 'stl_jDk30akdN',
    reason: {
      code: 'AC01',
      description: 'Incorrect Account Number',
    },
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/payments/tr_WDqYK6vllg/chargebacks/chb_n9z0tp',
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
