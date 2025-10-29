import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth, makeRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';
export const findOrCreateCustomerAction = createAction({
  auth: bigcommerceAuth,
  name: 'find_or_create_customer',
  displayName: 'Find or Create Customer',
  description: 'Finds an existing customer or creates a new one',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email address',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: true,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
  },
  async run(context) {
    // Search for existing customer
    const searchResponse = await makeRequest(
      context.auth,
      `/v3/customers?email:in=${context.propsValue.email}`,
      HttpMethod.GET
    );
    
    if (searchResponse.body.data && searchResponse.body.data.length > 0) {
      return { found: true, customer: searchResponse.body.data[0] };
    }
    
    // Create new customer
    const createResponse = await makeRequest(
      context.auth,
      '/v3/customers',
      HttpMethod.POST,
      [{
        email: context.propsValue.email,
        first_name: context.propsValue.first_name,
        last_name: context.propsValue.last_name,
        company: context.propsValue.company,
        phone: context.propsValue.phone,
      }]
    );
    
    return { found: false, customer: createResponse.body.data[0] };
  },
});
