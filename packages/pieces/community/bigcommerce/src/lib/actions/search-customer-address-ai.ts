import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { pagingProps } from '../common/props';
import { addressListOutputSchema } from '../common/schemas';
import { parseIdList, runSearchCustomerAddresses } from '../common/shared-runs';

export const searchCustomerAddressAi = createAction({
  auth: bigcommerceAuth,
  name: 'searchCustomerAddressAi',
  classification: 'SEARCH',
  displayName: 'Search Customer Address (AI)',
  description: 'Searches customer addresses by customer IDs. Built for AI agents.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches customer addresses in a BigCommerce store. customer_ids is a comma-separated list of numeric customer ids (find them with Search Customer); name matches the name on the address exactly. With no filters it returns every address in the store. Returns { data, meta.pagination }; limit (1-250, default 50) and page (from 1) control paging. Read-only.',
    idempotent: true,
  },
  outputSchema: addressListOutputSchema,
  props: {
    customer_ids: Property.ShortText({
      displayName: 'Customer IDs',
      description: 'Comma-separated numeric customer IDs, for example 12,15',
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
    return await runSearchCustomerAddresses({
      auth: context.auth.props,
      customerIds: parseIdList({ value: customer_ids, field: 'customer_ids' }),
      name,
      limit,
      page,
    });
  },
});
