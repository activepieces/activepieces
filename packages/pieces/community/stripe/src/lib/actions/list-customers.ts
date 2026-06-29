import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeListCustomers = createAction({
  name: 'list_customers',
  auth: stripeAuth,
  displayName: 'List Customers (Agent)',
  description: 'List Stripe customers, optionally filtered by email.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through Stripe customers, newest first, optionally filtered by an exact email. Use to enumerate customers or resolve a customer ID; for query-language matching use Search Customers, or Get Customer when you have the cus_ ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Filter to customers with this exact email.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of customers to return (1-100, default 10).',
      required: false,
    }),
    starting_after: Property.ShortText({
      displayName: 'Starting After',
      description:
        'A customer ID; returns the page of results after this cursor for pagination.',
      required: false,
    }),
  },
  async run(context) {
    const { email, limit, starting_after } = context.propsValue;

    const queryParams: QueryParams = {};
    if (email) queryParams['email'] = email;
    if (limit) queryParams['limit'] = limit.toString();
    if (starting_after) queryParams['starting_after'] = starting_after;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/customers`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
