import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getCustomers } from '../common';

export const getCustomersAction = createAction({
  auth: shopifyAuth,
  name: 'get_customers',
  displayName: 'Get Customers',
  description: `Get an existing customers.`,
  audience: 'both',
  aiMetadata: { description: 'Retrieve the list of customers in the Shopify store. Read-only and repeatable; pick this to browse or enumerate customer records when you do not have a specific customer ID. Returns all customers without filtering.', idempotent: true },
  props: {
  },
  async run({ auth }) {
    return await getCustomers(auth);
  },
});
