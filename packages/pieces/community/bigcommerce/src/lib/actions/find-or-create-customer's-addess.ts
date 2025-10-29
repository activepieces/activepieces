import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth, makeRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';
export const findOrCreateCustomerAddressAction = createAction({
  auth: bigcommerceAuth,
  name: 'find_or_create_customer_address',
  displayName: "Find or Create Customer's Address",
  description: 'Finds an existing customer address or creates a new one',
  props: {
    customer_id: Property.Number({
      displayName: 'Customer ID',
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
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      required: true,
    }),
    address2: Property.ShortText({
      displayName: 'Address Line 2',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: true,
    }),
    state_or_province: Property.ShortText({
      displayName: 'State/Province',
      required: true,
    }),
    postal_code: Property.ShortText({
      displayName: 'Postal Code',
      required: true,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: 'ISO 3166-1 alpha-2 country code',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
  },
  async run(context) {
    // Search for existing addresses
    const searchResponse = await makeRequest(
      context.auth,
      `/v3/customers/addresses?customer_id:in=${context.propsValue.customer_id}`,
      HttpMethod.GET
    );
    
    // Check if address already exists (match by address1, city, postal_code)
    if (searchResponse.body.data && searchResponse.body.data.length > 0) {
      const existingAddress = searchResponse.body.data.find((addr: any) => 
        addr.address1 === context.propsValue.address1 &&
        addr.city === context.propsValue.city &&
        addr.postal_code === context.propsValue.postal_code
      );
      
      if (existingAddress) {
        return { found: true, address: existingAddress };
      }
    }
    
    // Create new address
    const createResponse = await makeRequest(
      context.auth,
      `/v3/customers/addresses`,
      HttpMethod.POST,
      [{
        customer_id: context.propsValue.customer_id,
        first_name: context.propsValue.first_name,
        last_name: context.propsValue.last_name,
        address1: context.propsValue.address1,
        address2: context.propsValue.address2,
        city: context.propsValue.city,
        state_or_province: context.propsValue.state_or_province,
        postal_code: context.propsValue.postal_code,
        country_code: context.propsValue.country_code,
        phone: context.propsValue.phone,
      }]
    );
    
    return { found: false, address: createResponse.body.data[0] };
  },
});