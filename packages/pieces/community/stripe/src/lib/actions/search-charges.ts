import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeSearchCharges = createAction({
  name: 'search_charges',
  auth: stripeAuth,
  displayName: 'Search Charges (Agent)',
  description: 'Search charges with a Stripe search query.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Searches charges using the Stripe Search Query Language (e.g. \"status:'succeeded' AND amount>1000\"). Use for ad-hoc filtered lookups; use List Charges for simple paging or Retrieve Charge when you have the ch_ ID. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: "A Stripe search query (e.g. metadata['order_id']:'6735').",
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
      url: `${stripeCommon.baseUrl}/charges/search`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
