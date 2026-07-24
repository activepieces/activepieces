import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { paymentIntentOutputSchema } from '../output-schemas';
export const stripeGetPaymentIntent = createAction({
  name: 'get_payment_intent',
  auth: stripeAuth,
  displayName: 'Get Payment Intent (Agent)',
  description: 'Retrieve a payment by its PaymentIntent ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single payment by its PaymentIntent ID (e.g., pi_...). Use when you have the exact ID and need the current status, amount, or associated charge; use List/Search Payment Intents to discover IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    payment_intent_id: Property.ShortText({
      displayName: 'Payment Intent ID',
      description:
        'The PaymentIntent ID (e.g., pi_...). Obtain it from List Payment Intents or Search Payment Intents.',
      required: true,
    }),
  },
  outputSchema: paymentIntentOutputSchema,
  async run(context) {
    const { payment_intent_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/payment_intents/${payment_intent_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    return response.body;
  },
});
