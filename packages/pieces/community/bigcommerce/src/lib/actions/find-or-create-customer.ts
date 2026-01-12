import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

export const findOrCreateCustomer = createAction({
  auth: bigcommerceAuth,
  name: 'findOrCreateCustomer',
  displayName: 'Find or Create Customer',
  description: 'Finds or creates a customer',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email address',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Customer first name',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Customer last name',
      required: true,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Customer company name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Customer phone number',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Customer notes',
      required: false,
    }),
  },
  async run(context) {
    const params = new URLSearchParams();

    params.append('email:in', context.propsValue.email);
    
    if (context.propsValue.phone)
      params.append('phone:in', context.propsValue.phone);

    const response = await bigCommerceApiService.fetchCustomers({
      auth: context.auth.props,
      queryString: params.toString(),
    });

    if (response.data && response.data.length > 0) {
      return { found: true, data: response.data };
    }

    const newCustomer = await bigCommerceApiService.createCustomer({
      auth: context.auth.props,
      payload: [  
        {
          email: context.propsValue.email,
          first_name: context.propsValue.first_name,
          last_name: context.propsValue.last_name,
          company: context.propsValue.company,
          phone: context.propsValue.phone,
          notes: context.propsValue.notes,
        },
      ],
    });

    return { found: false, data: newCustomer.data };
  },
});
