import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { findOrdersOutputSchema } from '../output-schemas';

export const wooFindOrders = createAction({
  name: 'Find Orders',
  classification: 'READ',
  displayName: 'Find Orders',
  description: 'Search orders by status, customer or date',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches orders in a WooCommerce store, optionally narrowed by status, customer ID, or a created-after date, and returns a list of full order records. Use when an agent needs to process a batch of orders rather than one known order. Read-only and idempotent. Returns an array, newest first.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: findOrdersOutputSchema,
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only return orders with this status',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Pending', value: 'pending' },
          { label: 'Processing', value: 'processing' },
          { label: 'On hold', value: 'on-hold' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Refunded', value: 'refunded' },
          { label: 'Failed', value: 'failed' },
          { label: 'Trash', value: 'trash' },
        ],
      },
    }),
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Only return orders belonging to this customer ID',
      required: false,
    }),
    after: Property.DateTime({
      displayName: 'Created After',
      description: 'Only return orders created after this date',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of orders to return (1-100, default 10)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');
    const { status, customer, after, per_page } = configValue.propsValue;

    const queryParams: Record<string, string> = {
      per_page: String(per_page ?? 10),
    };
    if (status) {
      queryParams['status'] = status;
    }
    if (customer) {
      queryParams['customer'] = customer;
    }
    if (after) {
      queryParams['after'] = after;
    }

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/orders`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.props.consumerKey,
        password: configValue.auth.props.consumerSecret,
      },
      queryParams,
    };

    const res = await httpClient.sendRequest(request);

    return res.body;
  },
});
