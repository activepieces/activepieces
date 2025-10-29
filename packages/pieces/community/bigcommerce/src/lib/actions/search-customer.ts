import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth, makeRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchCustomerAction = createAction({
  auth: bigcommerceAuth,
  name: 'search_customer',
  displayName: 'Search Customer',
  description: 'Searches for a customer by email or name',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email to search for',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Customer first name to search for',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Customer last name to search for',
      required: false,
    }),
  },
  async run(context) {
    const params = new URLSearchParams();
    if (context.propsValue.email) params.append('email:in', context.propsValue.email);
    if (context.propsValue.first_name) params.append('first_name:in', context.propsValue.first_name);
    if (context.propsValue.last_name) params.append('last_name:in', context.propsValue.last_name);
    
    const response = await makeRequest(
      context.auth,
      `/v3/customers?${params.toString()}`,
      HttpMethod.GET
    );
    return response.body;
  },
});
