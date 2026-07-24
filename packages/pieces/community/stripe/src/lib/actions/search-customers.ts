import { createAction, Property } from '@activepieces/pieces-framework';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';

import { customerSearchOutputSchema } from '../output-schemas';
export const stripeSearchCustomers = createAction({
  name: 'search_customers',
  auth: stripeAuth,
  displayName: 'Search Customers (Agent)',
  description: 'Search for Stripe customers by email or a raw search query.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Searches Stripe customers using the Stripe Search Query Language. Pass an email to match customers with that exact email, or supply a raw query for richer filters (e.g. \"name:'Jane' OR metadata['plan']:'gold'\"). Use to find an existing customer before creating/charging one; use Get Customer when you already have the cus_ ID. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description:
        'Match customers with this exact email. Ignored if a raw Query is provided.',
      required: false,
    }),
    query: Property.ShortText({
      displayName: 'Query',
      description:
        "A raw Stripe search query (e.g. email:'a@b.com', name:'Jane'). Overrides the Email field when set.",
      required: false,
    }),
  },
  outputSchema: customerSearchOutputSchema,
  async run(context) {
    const { email, query } = context.propsValue;

    const searchQuery = query
      ? query
      : email
      ? `email:'${email}'`
      : undefined;

    if (!searchQuery) {
      throw new Error('Provide either an Email or a raw Query to search.');
    }

    const queryParams: QueryParams = { query: searchQuery };

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/customers/search`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });
    return response.body;
  },
});
