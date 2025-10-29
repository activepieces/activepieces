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
    if (context.propsValue.customer_ids)
      params.append(
        'customer_ids:in',
        (context.propsValue.customer_ids as string[]).join(',')
      );
    if (context.propsValue.first_name || context.propsValue.last_name)
      params.append(
        'name:in',
        `${context.propsValue.first_name || ''} ${
          context.propsValue.last_name || ''
        }`.trim()
      );

    return await bigCommerceApiService.fetchCustomerAddresses({
      auth: context.auth,
      queryString: params.toString(),
    });
  },
});
