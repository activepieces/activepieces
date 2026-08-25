import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getCustomerOrders } from '../common';

export const getCustomerOrdersAction = createAction({
  auth: shopifyAuth,
  name: 'get_customer_orders',
  displayName: 'Get Customer Orders',
  description: `Get an existing customer's orders.`,
  audience: 'both',
  aiMetadata: { description: 'Retrieve all orders placed by a specific customer, identified by customer ID. Read-only and repeatable; pick this when you need a customer\'s order history rather than a single order or the full store order list.', idempotent: true },
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { customerId } = propsValue;

    return await getCustomerOrders(customerId, auth);
  },
});
