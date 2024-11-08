import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getCustomers } from '../common';

export const getCustomersAction = createAction({
  auth: shopifyAuth,
  name: 'get_customers',
  displayName: 'Get Customers',
  description: `Get an existing customers.`,
  props: {
  },
  async run({ auth }) {
    return await getCustomers(auth);
  },
});
