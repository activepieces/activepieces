import { createAction, Property } from '@activepieces/pieces-framework';
import { bigCommerceApiService } from '../common/requests';
import { bigcommerceAuth } from '../common/auth';
import { multiCustomerDropdown } from '../common/props';

export const searchCustomerAddress = createAction({
  auth: bigcommerceAuth,
  name: 'searchCustomerAddress',
  displayName: 'Search Customer Address',
  description: 'Searches for a customer’s address',
  props: {
    customer_ids: multiCustomerDropdown({
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
    if (context.propsValue.customer_ids)
      params.append(
        'customer_ids:in',
        (context.propsValue.customer_ids as string[]).join(',')
      );
    if (context.propsValue.name)
      params.append('name:in', `${context.propsValue.name}`);

    return await bigCommerceApiService.fetchCustomerAddresses({
      auth: context.auth.props,
      queryString: params.toString(),
    });
  },
});
