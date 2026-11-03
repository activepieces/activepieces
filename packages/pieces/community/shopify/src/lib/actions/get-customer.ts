import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getCustomer } from '../common';

export const getCustomerAction = createAction({
  auth: shopifyAuth,
  name: 'get_customer',
  classification: 'READ',
  displayName: 'Get Customer',
  description: 'Get a customer by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single Shopify customer record by customer ID. Use when you already have the ID and need the full customer details; to search by name or email use a product/customer listing action instead. Read-only and idempotent.', idempotent: true },
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: "The number at the end of the customer's URL in Shopify admin.",
      placeholder: '1234567890',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { customerId } = propsValue;

    return await getCustomer(customerId, auth);
  },
});
