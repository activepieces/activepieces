import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { refundOutputSchema } from '../output-schemas';
export const stripeCreateRefundAi = createAction({
  name: 'create_refund_ai',
  auth: stripeAuth,
  displayName: 'Create Refund (Agent)',
  description: 'Create a full or partial refund for a payment.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Issues a refund against a payment identified by its PaymentIntent ID; refunds the full amount by default, or a partial amount if given, with an optional reason. Amount is in the major currency unit as a decimal. Use to return funds for a captured payment. Not idempotent: each call creates a new refund and moves money again.',
    idempotent: false,
  },
  props: {
    payment_intent: Property.ShortText({
      displayName: 'Payment Intent ID',
      description:
        'The PaymentIntent ID (e.g., pi_...) to refund. Obtain it from List/Search Payment Intents.',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description:
        'The amount to refund as a decimal (e.g., 12.99). If left blank, a full refund is issued.',
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
  outputSchema: refundOutputSchema,
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
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    return response.body;
  },
});
