import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { paymentIntentSearchOutputSchema } from '../output-schemas';
export const stripeSearchPaymentIntents = createAction({
  name: 'search_payment_intents',
  auth: stripeAuth,
  displayName: 'Search Payment Intents (Agent)',
  description: 'Search PaymentIntents with a Stripe search query.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Searches PaymentIntents using the Stripe Search Query Language (e.g. \"status:'succeeded' AND customer:'cus_...'\"). Use for ad-hoc filtered lookups; use List Payment Intents for simple paging or Get Payment Intent when you have the pi_ ID. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        "A Stripe search query (e.g. status:'succeeded' AND amount>1000).",
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  outputSchema: paymentIntentSearchOutputSchema,
  async run(context) {
    const { query, limit } = context.propsValue;

    const queryParams: QueryParams = { query };
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/payment_intents/search`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
