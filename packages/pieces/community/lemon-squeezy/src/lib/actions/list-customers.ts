import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { lsRequest, pageParams } from '../common/client';
import { storeOptions } from '../common/props';
import { rawSchemas } from '../common/output-schemas';
export const listCustomers = createAction({
  name: 'list_customers',
  classification: 'SEARCH',
  displayName: 'List Customers',
  description: 'Retrieve a paginated list of customers from your Lemon Squeezy store.',
  audience: 'both',
  aiMetadata: { description: 'List customers from Lemon Squeezy, optionally narrowed by store (empty store spans all stores) and email address, with page-based pagination. Use to look up a customer by email or enumerate the customer base. Read-only and idempotent.', idempotent: true },
  auth: lemonSqueezyAuth,
  outputSchema: rawSchemas.customers,
  props: {
    storeId: Property.Dropdown({
      displayName: 'Store',
      description: 'Filter customers by store. Leave empty to return customers from all stores.',
      required: false,
      auth: lemonSqueezyAuth,
      refreshers: ['auth'],
      options: async ({ auth }) => storeOptions({ auth }),
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Filter customers by their email address.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (starts at 1).',
      required: false,
      defaultValue: 1,
    }),
    perPage: Property.Number({
      displayName: 'Per Page',
      description: 'Number of customers to return per page (1–100). Default is 10.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const queryParams: Record<string, string> = {};

    if (propsValue.storeId) queryParams['filter[store_id]'] = propsValue.storeId;
    if (propsValue.email) queryParams['filter[email]'] = propsValue.email;
    Object.assign(queryParams, pageParams(propsValue));

    const response = await lsRequest({
      apiKey: auth.secret_text,
      method: 'GET',
      path: '/customers',
      query: queryParams,
    });

    return response.body;
  },
});
