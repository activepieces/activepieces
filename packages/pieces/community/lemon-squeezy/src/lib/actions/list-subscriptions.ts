import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { lemonSqueezyAuth, LEMON_SQUEEZY_API_BASE, getLemonSqueezyHeaders } from '../auth';

export const listSubscriptions = createAction({
  name: 'list_subscriptions',
  displayName: 'List Subscriptions',
  description: 'Retrieve a paginated list of subscriptions from your Lemon Squeezy store.',
  auth: lemonSqueezyAuth,
  props: {
    storeId: Property.ShortText({
      displayName: 'Store ID',
      description: 'Filter subscriptions by a specific store ID.',
      required: false,
    }),
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'Filter subscriptions by a specific order ID.',
      required: false,
    }),
    orderItemId: Property.ShortText({
      displayName: 'Order Item ID',
      description: 'Filter subscriptions by a specific order item ID.',
      required: false,
    }),
    productId: Property.ShortText({
      displayName: 'Product ID',
      description: 'Filter subscriptions by a specific product ID.',
      required: false,
    }),
    variantId: Property.ShortText({
      displayName: 'Variant ID',
      description: 'Filter subscriptions by a specific variant ID.',
      required: false,
    }),
    userEmail: Property.ShortText({
      displayName: 'Customer Email',
      description: 'Filter subscriptions by customer email address.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Subscription Status',
      description: 'Filter subscriptions by status.',
      required: false,
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'On Trial', value: 'on_trial' },
          { label: 'Active', value: 'active' },
          { label: 'Paused', value: 'paused' },
          { label: 'Past Due', value: 'past_due' },
          { label: 'Unpaid', value: 'unpaid' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Expired', value: 'expired' },
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
      description: 'Number of subscriptions to return per page (1–100). Default is 10.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const queryParams: Record<string, string> = {};

    if (propsValue.storeId) queryParams['filter[store_id]'] = propsValue.storeId;
    if (propsValue.orderId) queryParams['filter[order_id]'] = propsValue.orderId;
    if (propsValue.orderItemId) queryParams['filter[order_item_id]'] = propsValue.orderItemId;
    if (propsValue.productId) queryParams['filter[product_id]'] = propsValue.productId;
    if (propsValue.variantId) queryParams['filter[variant_id]'] = propsValue.variantId;
    if (propsValue.userEmail) queryParams['filter[user_email]'] = propsValue.userEmail;
    if (propsValue.status) queryParams['filter[status]'] = propsValue.status;
    if (propsValue.page) queryParams['page[number]'] = String(propsValue.page);
    if (propsValue.perPage) queryParams['page[size]'] = String(propsValue.perPage);

    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${LEMON_SQUEEZY_API_BASE}/subscriptions${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: getLemonSqueezyHeaders(auth as string),
    });

    return response.body;
  },
});
