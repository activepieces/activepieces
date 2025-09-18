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

export const stripeNewDispute = createTrigger({
  auth: stripeAuth,
  name: 'new_dispute',
  displayName: 'New Dispute',
  description: 'Fires when a customer disputes a charge.',
  props: {
    charge: Property.ShortText({
      displayName: 'Charge ID',
      description:
        'Only trigger for disputes related to this Charge ID (e.g., `ch_...`).',
      required: false,
    }),
    payment_intent: Property.ShortText({
      displayName: 'Payment Intent ID',
      description:
        'Only trigger for disputes related to this Payment Intent ID (e.g., `pi_...`).',
      required: false,
    }),
  },
  sampleData: {
    id: 'du_1MtJUT2eZvKYlo2CNaw2HvEv',
    object: 'dispute',
    amount: 1000,
    balance_transactions: [],
    charge: 'ch_1AZtxr2eZvKYlo2CJDX8whov',
    created: 1680651737,
    currency: 'usd',
    evidence_details: {
      due_by: 1682294399,
      has_evidence: false,
      past_due: false,
      submission_count: 0,
    },
    is_charge_refundable: true,
    livemode: false,
    metadata: {},
    payment_intent: 'pi_1AZtxr2eZvKYlo2CJDX8whov',
    reason: 'general',
    status: 'needs_response',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook(
      'charge.dispute.created',
      context.webhookUrl,
      context.auth
    );
    await context.store.put<StripeWebhookInformation>('_new_dispute_trigger', {
      webhookId: webhook.id,
    });
  },

  async onDisable(context) {
    const webhookInfo = await context.store.get<StripeWebhookInformation>(
      '_new_dispute_trigger'
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
      url: 'https://api.stripe.com/v1/checkout/disputes',
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
    const disputeObject = payloadBody.data.object;
    const { charge, payment_intent } = context.propsValue;

    if (charge && disputeObject['charge'] !== charge) {
      return [];
    }
    if (payment_intent && disputeObject['payment_intent'] !== payment_intent) {
      return [];
    }

    return [disputeObject];
  },
});
