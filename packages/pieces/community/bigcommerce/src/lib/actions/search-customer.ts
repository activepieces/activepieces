import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

export const searchCustomer = createAction({
  auth: bigcommerceAuth,
  name: 'searchCustomer',
  displayName: 'Search Customer',
  description: 'Searches for a registered customer',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email to search for',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone Number to search for',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Customer name to search for',
      required: false,
    }),
  },
  async run(context) {
    const params = new URLSearchParams();
    if (context.propsValue.email)
      params.append('email:in', context.propsValue.email);
    if (context.propsValue.name)
      params.append('name:in', `${context.propsValue.name}`);
    if (context.propsValue.phone)
      params.append('phone:in', context.propsValue.phone);

    return await bigCommerceApiService.fetchCustomers({
      auth: context.auth.props,
      queryString: params.toString(),
    });
  },
});
