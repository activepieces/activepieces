import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { lemonSqueezyAuth } from '../common/auth';
import { LEMON_SQUEEZY_API_BASE, getLemonSqueezyHeaders } from '../common/api';

export const listOrders = createAction({
  name: 'list_orders',
  displayName: 'List Orders',
  description: 'Retrieve a paginated list of orders from your Lemon Squeezy store, with optional filters.',
  auth: lemonSqueezyAuth,
  props: {
    storeId: Property.ShortText({
      displayName: 'Store ID',
      description: 'Filter orders by a specific store ID.',
      required: false,
    }),
    userEmail: Property.ShortText({
      displayName: 'Customer Email',
      description: 'Filter orders by customer email address.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Order Status',
      description: 'Filter orders by status.',
      required: false,
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'Pending', value: 'pending' },
          { label: 'Failed', value: 'failed' },
          { label: 'Paid', value: 'paid' },
          { label: 'Refunded', value: 'refunded' },
          { label: 'Partial Refund', value: 'partial_refund' },
          { label: 'Chargedback', value: 'chargedback' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (starts at 1).',
      required: false,
      defaultValue: 1,
    }),
    perPage: Property.Number({
      displayName: 'Per Page',
      description: 'Number of orders to return per page (1–100). Default is 10.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const queryParams: Record<string, string> = {};

    if (propsValue.storeId) queryParams['filter[store_id]'] = propsValue.storeId;
    if (propsValue.userEmail) queryParams['filter[user_email]'] = propsValue.userEmail;
    if (propsValue.status) queryParams['filter[status]'] = propsValue.status;
    if (propsValue.page) queryParams['page[number]'] = String(propsValue.page);
    if (propsValue.perPage) queryParams['page[size]'] = String(propsValue.perPage);

    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${LEMON_SQUEEZY_API_BASE}/orders${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: getLemonSqueezyHeaders(auth as string),
    });

    return response.body;
  },
});
