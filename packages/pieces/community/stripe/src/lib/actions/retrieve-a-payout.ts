import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';

export const createARefund = createAction({
  auth: stripeAuth,
  name: 'createARefund',
  displayName: 'Create A Refund',
  description: 'Create a refund for a charge or payment intent in Stripe.',
  props: {
    payment_intent: Property.ShortText({
      displayName: 'Payment Intent ID',
      required: false,
      description: 'The ID of the PaymentIntent to refund.',
    }),
    charge: Property.ShortText({
      displayName: 'Charge ID',
      required: false,
      description: 'The ID of the charge to refund.',
    }),
    amount: Property.Number({
      displayName: 'Amount (in cents)',
      required: false,
      description: 'A positive integer representing how much to refund.',
    }),
    reason: Property.ShortText({
      displayName: 'Reason',
      required: false,
      description: 'Reason for the refund (duplicate, fraudulent, requested_by_customer).',
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      required: false,
      description: 'Key-value pairs to attach to the refund.',
    }),
  },
  async run({ auth, propsValue }) {
    const { payment_intent, charge, amount, reason, metadata } = propsValue;

    const body: Record<string, any> = {
      payment_intent,
      charge,
      amount,
      reason,
    };

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        body[`metadata[${key}]`] = value;
      });
    }

    // Remove undefined values
    Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.stripe.com/v1/refunds',
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});