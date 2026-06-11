import { createAction, Property } from '@activepieces/pieces-framework';
import { bigCommerceApiService } from '../common/requests';
import { bigcommerceAuth } from '../common/auth';
import { multiCustomerDropdown } from '../common/props';

export const searchCustomerAddress = createAction({
  auth: bigcommerceAuth,
  name: 'searchCustomerAddress',
  displayName: 'Search Customer Address',
  description: 'Searches for a customer’s address',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches customer addresses in a BigCommerce store, optionally filtered by one or more customer ids and/or a name. With no filters it returns all addresses; supplying filters narrows to matches. Use to look up addresses belonging to specific customers. Idempotent read-only query with no side effects.',
    idempotent: true,
  },
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
