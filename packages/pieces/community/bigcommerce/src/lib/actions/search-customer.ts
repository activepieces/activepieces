import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { pagingProps } from '../common/props';
import { bigCommerceApiService } from '../common/requests';
import { customerListOutputSchema } from '../common/schemas';
import { validatePaging } from '../common/shared-runs';

export const searchCustomer = createAction({
  auth: bigcommerceAuth,
  name: 'searchCustomer',
  classification: 'SEARCH',
  displayName: 'Search Customer',
  description: 'Searches for registered customers by email, phone or name',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches registered customers in a BigCommerce store. email and phone match exactly; name matches any customer whose first or last name contains the text. With no filters it returns all customers. Returns { data, meta.pagination }; limit (1-250, default 50) and page (from 1) control paging. Use to find a customer id or check whether a customer exists before creating one. Read-only.',
    idempotent: true,
  },
  outputSchema: customerListOutputSchema,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Exact, full email address. For a partial search, use Name instead.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone Number to search for (exact match)',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Partial search: matches customers whose first or last name contains this text',
      required: false,
    }),
    ...pagingProps,
  },
  async run(context) {
    const { email, phone, name, limit, page } = context.propsValue;
    const paging = validatePaging({ limit, page });
    return await bigCommerceApiService.fetchCustomers({
      auth: context.auth.props,
      query: {
        'email:in': email,
        'name:like': name,
        'phone:in': phone,
        ...paging,
      },
    });
  },
});
