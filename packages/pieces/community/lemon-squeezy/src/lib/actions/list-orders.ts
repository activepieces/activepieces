import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { lsRequest, pageParams } from '../common/client';
import { storeOptions } from '../common/props';
import { rawSchemas } from '../common/output-schemas';
export const listOrders = createAction({
  name: 'list_orders',
  classification: 'SEARCH',
  displayName: 'List Orders',
  description: 'Retrieve a paginated list of orders from your Lemon Squeezy store, with optional filters.',
  audience: 'both',
  aiMetadata: { description: 'List orders from Lemon Squeezy, optionally narrowed by store (empty store spans all stores), customer email, and order status (pending, paid, refunded, etc.), with page-based pagination. Use to find or audit orders by criteria; pair with Get Order for full detail on a single order. Read-only and idempotent.', idempotent: true },
  auth: lemonSqueezyAuth,
  outputSchema: rawSchemas.orders,
  props: {
    storeId: Property.Dropdown({
      displayName: 'Store',
      description: 'Filter orders by store. Leave empty to return orders from all stores.',
      required: false,
      auth: lemonSqueezyAuth,
      refreshers: ['auth'],
      options: async ({ auth }) => storeOptions({ auth }),
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
    Object.assign(queryParams, pageParams(propsValue));

    const response = await lsRequest({
      apiKey: auth.secret_text,
      method: 'GET',
      path: '/orders',
      query: queryParams,
    });

    return response.body;
  },
});
