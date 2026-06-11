import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

export const searchCustomer = createAction({
  auth: bigcommerceAuth,
  name: 'searchCustomer',
  displayName: 'Search Customer',
  description: 'Searches for a registered customer',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches registered customers in a BigCommerce store by email, phone, and/or name. With no filters it returns all customers; supplying any filter narrows to matches. Use to look up a customer or check whether one exists before creating it. Idempotent read-only query with no side effects.',
    idempotent: true,
  },
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
