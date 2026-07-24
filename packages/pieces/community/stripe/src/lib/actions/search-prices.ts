import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { priceSearchOutputSchema } from '../output-schemas';
export const stripeSearchPrices = createAction({
  name: 'search_prices',
  auth: stripeAuth,
  displayName: 'Search Prices (Agent)',
  description: 'Search prices with a Stripe search query.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Searches prices using the Stripe Search Query Language (e.g. \"active:'true' AND currency:'usd'\"). Use for metadata/attribute matching; use List Prices for simple paging or Get Price when you have the price_ ID. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: "A Stripe search query (e.g. lookup_key:'standard_monthly').",
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  outputSchema: priceSearchOutputSchema,
  async run(context) {
    const { query, limit } = context.propsValue;

    const queryParams: QueryParams = { query };
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/prices/search`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
