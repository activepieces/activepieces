import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getCustomer } from '../common';

export const getCustomerAction = createAction({
  auth: shopifyAuth,
  name: 'get_customer',
  displayName: 'Get Customer',
  description: `Get an existing customer's information.`,
  audience: 'both',
  aiMetadata: { description: 'Fetch a single Shopify customer record by customer ID. Use when you already have the ID and need the full customer details; to search by name or email use a product/customer listing action instead. Read-only and idempotent.', idempotent: true },
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
