import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getCustomerOrders } from '../common';

export const getCustomerOrdersAction = createAction({
  auth: shopifyAuth,
  name: 'get_customer_orders',
  displayName: 'Get Customer Orders',
  description: `Get an existing customer's orders.`,
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
