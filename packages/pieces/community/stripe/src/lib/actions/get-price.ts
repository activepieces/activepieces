import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { priceOutputSchema } from '../output-schemas';
export const stripeGetPrice = createAction({
  name: 'get_price',
  auth: stripeAuth,
  displayName: 'Get Price (Agent)',
  description: 'Retrieve a Stripe price by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single Stripe price by its price ID (e.g., price_...). Use List/Search Prices to discover IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    price_id: Property.ShortText({
      displayName: 'Price ID',
      description:
        'The price ID (e.g., price_...). Obtain it from List/Search Prices.',
      required: true,
    }),
  },
  outputSchema: priceOutputSchema,
  async run(context) {
    const { price_id } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/prices/${price_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});
