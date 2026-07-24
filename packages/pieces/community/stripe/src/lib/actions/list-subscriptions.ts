import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { subscriptionListOutputSchema } from '../output-schemas';
export const stripeListSubscriptions = createAction({
  name: 'list_subscriptions',
  auth: stripeAuth,
  displayName: 'List Subscriptions (Agent)',
  description: 'List Stripe subscriptions.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Pages through subscriptions, newest first, optionally filtered by customer, status, or price. Use to enumerate or audit a customer's subscriptions; for rich filters/customer-hydration use Search Subscriptions, or Get Subscription when you have the sub_ ID. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Filter to subscriptions for this customer (cus_...).',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Past Due', value: 'past_due' },
          { label: 'Unpaid', value: 'unpaid' },
          { label: 'Canceled', value: 'canceled' },
          { label: 'Incomplete', value: 'incomplete' },
          { label: 'Incomplete Expired', value: 'incomplete_expired' },
          { label: 'Trialing', value: 'trialing' },
          { label: 'Paused', value: 'paused' },
        ],
      },
    }),
    price: Property.ShortText({
      displayName: 'Price ID',
      description: 'Filter to subscriptions containing this price (price_...).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  outputSchema: subscriptionListOutputSchema,
  async run(context) {
    const { customer, status, price, limit } = context.propsValue;

    const queryParams: QueryParams = {};
    if (customer) queryParams['customer'] = customer;
    if (status) queryParams['status'] = status;
    if (price) queryParams['price'] = price;
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/subscriptions`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
