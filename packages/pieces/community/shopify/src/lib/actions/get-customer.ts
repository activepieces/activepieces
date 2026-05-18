import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getCustomer } from '../common';

export const getCustomerAction = createAction({
  auth: shopifyAuth,
  name: 'get_customer',
  displayName: 'Get Customer',
  description: `Get an existing customer's information.`,
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { customerId } = propsValue;

    return await getCustomer(customerId, auth);
  },
});
