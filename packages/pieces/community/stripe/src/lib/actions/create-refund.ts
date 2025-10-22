import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeCreateRefund = createAction({
  name: 'create_refund',
  auth: stripeAuth,
  displayName: 'Create a Refund',
  description: 'Create a full or partial refund for a payment.',
  props: {
    payment_intent: stripeCommon.paymentIntent, 
    amount: Property.Number({
      displayName: 'Amount',
      description:
        'The amount to refund (e.g., 12.99). If left blank, a full refund will be issued.',
      required: false,
    }),
    reason: Property.StaticDropdown({
      displayName: 'Reason',
      description: 'An optional reason for the refund.',
      required: false,
      options: {
        options: [
          { label: 'Duplicate', value: 'duplicate' },
          { label: 'Fraudulent', value: 'fraudulent' },
          { label: 'Requested by Customer', value: 'requested_by_customer' },
        ],
      },
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description:
        'A set of key-value pairs to store additional information about the refund.',
      required: false,
    }),
  },
  async run(context) {
    const { payment_intent, amount, reason, metadata } = context.propsValue;

    const body: { [key: string]: unknown } = {
      payment_intent: payment_intent,
    };

    if (amount !== undefined && amount !== null) {
      body.amount = Math.round(amount * 100);
    }
    if (reason) {
      body.reason = reason;
    }
    if (metadata && typeof metadata === 'object') {
      Object.keys(metadata).forEach((key) => {
        body[`metadata[${key}]`] = (metadata as Record<string, string>)[key];
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/refunds`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    return response.body;
  },
});
