import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { gorgiasAuth } from '../../';
import { gorgiasApi } from '../common/client';
import { gorgiasCustomer, GorgiasCustomer } from '../common/customer';

export const findCustomer = createAction({
  auth: gorgiasAuth,
  name: 'find_customer',
  displayName: 'Find Customer by Email',
  description: 'Search for a customer by their email address.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the customer to find.',
      required: true,
    }),
  },
  async run(context) {
    const response = await gorgiasApi.call<{ data: GorgiasCustomer[] }>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/customers',
      queryParams: {
        email: context.propsValue.email,
        limit: '30',
      },
    });

    const customers = response.body.data ?? [];
    return {
      found: customers.length > 0,
      customers: customers.map((customer) => gorgiasCustomer.flattenCustomer(customer)),
    };
  },
});
