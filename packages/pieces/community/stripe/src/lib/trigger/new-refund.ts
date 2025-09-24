import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { StripeWebhookInformation } from '../common/types';
import { stripeAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isEmpty } from '@activepieces/shared';

type StripeWebhookPayload = {
  data: {
    object: {
      [key: string]: unknown;
    };
  };
};

export const stripeNewRefund = createTrigger({
  auth: stripeAuth,
  name: 'new_refund',
  displayName: 'New Refund',
  description: 'Fires when a charge is refunded (full or partial).',
  props: {
    charge: Property.ShortText({
      displayName: 'Charge ID',
      description:
        'Only trigger for refunds related to this Charge ID (e.g., `ch_...`).',
      required: false,
    }),
    payment_intent: Property.ShortText({
      displayName: 'Payment Intent ID',
      description:
        'Only trigger for refunds related to this Payment Intent ID (e.g., `pi_...`).',
      required: false,
    }),
  },
  sampleData: {
    id: 're_1Nispe2eZvKYlo2Cd31jOCgZ',
    object: 'refund',
    amount: 1000,
    balance_transaction: 'txn_1Nispe2eZvKYlo2CYezqFhEx',
    charge: 'ch_1NirD82eZvKYlo2CIvbtLWuY',
    created: 1692942318,
    currency: 'usd',
    metadata: {},
    payment_intent: 'pi_1GszsK2eZvKYlo2CfhZyoZLp',
    reason: 'requested_by_customer',
    receipt_number: null,
    status: 'succeeded',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook(
      'refund.created',
      context.webhookUrl,
      context.auth
    );
    await context.store.put<StripeWebhookInformation>('_new_refund_trigger', {
      webhookId: webhook.id,
    });
  },

  async onDisable(context) {
    const webhookInfo = await context.store.get<StripeWebhookInformation>(
      '_new_refund_trigger'
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
      url: 'https://api.stripe.com/v1/checkout/refunds',
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
    const refundObject = payloadBody.data.object;
    const { charge, payment_intent } = context.propsValue;

    if (charge && refundObject['charge'] !== charge) {
      return [];
    }
    if (payment_intent && refundObject['payment_intent'] !== payment_intent) {
      return [];
    }

    return [refundObject];
  },
});
