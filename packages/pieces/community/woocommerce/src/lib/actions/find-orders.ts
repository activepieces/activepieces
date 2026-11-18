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
  description: 'Search orders by status, customer or creation date',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches orders in a WooCommerce store, optionally narrowed by status, customer ID, or a created-after date, and returns a list of full order records. Use when an agent needs to process a batch of orders rather than one known order. Read-only and idempotent. Returns an array, newest first.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: findOrdersOutputSchema,
  propertyGroups: [
    {
      key: 'order',
      display: 'builder',
      label: 'Order',
      icon: 'filter',
      props: ['status', 'customer'],
    },
    {
      key: 'time',
      display: 'builder',
      label: 'Time',
      icon: 'calendar',
      props: ['after'],
    },
    { key: 'footer', display: 'footer', icon: 'sliders', props: ['per_page'] },
  ],
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only return orders with this status',
      icon: 'tag',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Pending payment', value: 'pending' },
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
      description: 'Only orders from this customer.',
      icon: 'user',
      placeholder: '123',
      required: false,
    }),
    after: Property.DateTime({
      displayName: 'Created After',
      description: 'Only return orders created after this date',
      icon: 'calendar',
      placeholder: '2026-01-31T00:00:00Z',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Max Results',
      description: 'How many orders to return, from 1 to 100.',
      required: false,
      defaultValue: 10,
      display: 'stepper',
      min: 1,
      max: 100,
      step: 1,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');
    const { status, customer, after, per_page } = configValue.propsValue;

    const n = Number(per_page ?? 10);
    const perPage = Number.isFinite(n)
      ? Math.min(100, Math.max(1, Math.trunc(n)))
      : 10;
    const queryParams: Record<string, string> = {
      per_page: String(perPage),
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
