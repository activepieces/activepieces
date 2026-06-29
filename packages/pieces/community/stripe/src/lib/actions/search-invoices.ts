import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeSearchInvoices = createAction({
  name: 'search_invoices',
  auth: stripeAuth,
  displayName: 'Search Invoices (Agent)',
  description: 'Search invoices with a Stripe search query.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Searches invoices using the Stripe Search Query Language (e.g. \"status:'open' AND customer:'cus_...'\"). Use for ad-hoc filtered lookups; use List Invoices for simple paging or Get Invoice when you have the in_ ID. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: "A Stripe search query (e.g. total>1000 AND status:'paid').",
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
      url: `${stripeCommon.baseUrl}/invoices/search`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
