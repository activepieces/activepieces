import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

export const listOrders = createAction({
  auth: virtualSmsAuth,
  name: 'list_orders',
  displayName: 'List Orders',
  description: 'List all orders, optionally filtered by status.',
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter orders by status. Leave blank to return all orders.',
      required: false,
      options: {
        options: [
          { label: 'Waiting', value: 'waiting' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Expired', value: 'expired' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return request(auth, HttpMethod.GET, '/api/v1/customer/orders', undefined, {
      status: propsValue.status ?? undefined,
    });
  },
});
