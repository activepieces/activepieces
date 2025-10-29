import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth, makeRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createCustomerAddressAction = createAction({
  auth: bigcommerceAuth,
  name: 'create_customer_address',
  displayName: 'Create Customer Address',
  description: 'Creates a new address for a customer',
  props: {
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: 'ID of the customer',
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
    const response = await makeRequest(
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
    return response.body;
  },
});
