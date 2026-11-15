import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { lsRequest, pageParams, seg } from '../common/client';
import { storeOptions, orderOptions, productOptions, variantOptions } from '../common/props';
import { rawSchemas } from '../common/output-schemas';
export const listSubscriptions = createAction({
  name: 'list_subscriptions',
  classification: 'SEARCH',
  displayName: 'List Subscriptions',
  description: 'Retrieve a paginated list of subscriptions from your Lemon Squeezy store.',
  audience: 'human',
  auth: lemonSqueezyAuth,
  outputSchema: rawSchemas.subscriptions,
  props: {
    storeId: Property.Dropdown({
      displayName: 'Store',
      description: 'Filter subscriptions by store.',
      required: false,
      auth: lemonSqueezyAuth,
      refreshers: ['auth'],
      options: async ({ auth }) => storeOptions({ auth }),
    }),
    orderId: Property.Dropdown({
      displayName: 'Order',
      description: 'Filter subscriptions by order.',
      required: false,
      auth: lemonSqueezyAuth,
      refreshers: ['auth', 'storeId'],
      options: async ({ auth, storeId }) => orderOptions({ auth, storeId }),
    }),
    orderItemId: Property.ShortText({
      displayName: 'Order Item ID',
      description: 'Filter subscriptions by a specific order item ID.',
      required: false,
    }),
    productId: Property.Dropdown({
      displayName: 'Product',
      description: 'Filter subscriptions by product.',
      required: false,
      auth: lemonSqueezyAuth,
      refreshers: ['auth', 'storeId'],
      options: async ({ auth, storeId }) => productOptions({ auth, storeId }),
    }),
    variantId: Property.Dropdown({
      displayName: 'Variant',
      description: 'Filter subscriptions by variant.',
      required: false,
      auth: lemonSqueezyAuth,
      refreshers: ['auth', 'productId'],
      options: async ({ auth, productId }) => variantOptions({ auth, productId }),
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
    if (propsValue.orderItemId) queryParams['filter[order_item_id]'] = seg({ value: propsValue.orderItemId, label: 'Order Item ID' });
    if (propsValue.productId) queryParams['filter[product_id]'] = propsValue.productId;
    if (propsValue.variantId) queryParams['filter[variant_id]'] = propsValue.variantId;
    if (propsValue.userEmail) queryParams['filter[user_email]'] = propsValue.userEmail;
    if (propsValue.status) queryParams['filter[status]'] = propsValue.status;
    Object.assign(queryParams, pageParams(propsValue));

    const response = await lsRequest({
      apiKey: auth.secret_text,
      method: 'GET',
      path: '/subscriptions',
      query: queryParams,
    });

    return response.body;
  },
});
