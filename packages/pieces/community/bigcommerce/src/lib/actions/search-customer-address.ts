import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { multiCustomerDropdown, pagingProps } from '../common/props';
import { addressListOutputSchema } from '../common/schemas';
import { parsePositiveIntId, runSearchCustomerAddresses } from '../common/shared-runs';

export const searchCustomerAddress = createAction({
  auth: bigcommerceAuth,
  name: 'searchCustomerAddress',
  classification: 'SEARCH',
  displayName: 'Search Customer Address',
  description: 'Searches for customer addresses',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches customer addresses in a BigCommerce store, filtered by customers picked from a dropdown and/or a name. Agents should use Search Customer Address (AI). Read-only.',
    idempotent: true,
  },
  outputSchema: addressListOutputSchema,
  props: {
    customer_ids: multiCustomerDropdown({
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name on the address to search for (exact match)',
      required: false,
    }),
    ...pagingProps,
  },
  async run(context) {
    const { customer_ids, name, limit, page } = context.propsValue;
    const ids = Array.isArray(customer_ids) ? customer_ids : [];
    return await runSearchCustomerAddresses({
      auth: context.auth.props,
      customerIds: ids.map((id) => parsePositiveIntId({ value: id, field: 'Customers' })),
      name,
      limit,
      page,
    });
  },
});
