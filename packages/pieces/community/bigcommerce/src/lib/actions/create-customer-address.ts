import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { customerDropdown } from '../common/props';
import { bigCommerceApiService } from '../common/requests';

export const createCustomerAddress = createAction({
  auth: bigcommerceAuth,
  name: 'createCustomerAddress',
  displayName: 'Create Customer Address',
  description: "Creates a customer's address",
  props: {
    customer_id: customerDropdown({
      required: true
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
    return await bigCommerceApiService.createCustomerAddress({
      auth: context.auth.props,
      payload: [
        {
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
        },
      ],
    });
  },
});
