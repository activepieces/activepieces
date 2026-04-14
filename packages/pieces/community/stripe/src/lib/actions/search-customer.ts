import { createAction, Property } from '@activepieces/pieces-framework';
import { stripeAuth } from '../..';
import { getClient } from '../common';

export const stripeSearchCustomer = createAction({
  name: 'search_customer',
  auth: stripeAuth,
  displayName: 'Search Customer',
  description: 'Search for a customer in stripe by email',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: undefined,
      required: true,
    }),
  },
  async run(context) {
    const customer = {
      email: context.propsValue.email,
    };
    const client = getClient(context.auth.secret_text);
    return await client.customers.search({
      query: `email:'${customer.email}'`,
    });
  },
});
