import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeSearchProducts = createAction({
  name: 'search_products',
  auth: stripeAuth,
  displayName: 'Search Products (Agent)',
  description: 'Search products with a Stripe search query.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Searches products using the Stripe Search Query Language (e.g. \"active:'true' AND name~'shirt'\"). Use for name/metadata matching; use List Products for simple paging or Get Product when you have the prod_ ID. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: "A Stripe search query (e.g. name~'shirt').",
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  async run(context) {
    const { query, limit } = context.propsValue;

    const queryParams: QueryParams = { query };
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/products/search`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
