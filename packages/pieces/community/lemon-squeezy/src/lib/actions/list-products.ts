import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { lsRequest, pageParams } from '../common/client';
import { storeOptions } from '../common/props';
import { rawSchemas } from '../common/output-schemas';
export const listProducts = createAction({
  name: 'list_products',
  classification: 'SEARCH',
  displayName: 'List Products',
  description: 'Retrieve a paginated list of products from your Lemon Squeezy store.',
  audience: 'both',
  aiMetadata: { description: 'List products from Lemon Squeezy, optionally scoped to one store (leave the store empty to span all stores) with page-based pagination. Use to enumerate a catalog or look up products before referencing a variant in a checkout. Read-only and idempotent.', idempotent: true },
  auth: lemonSqueezyAuth,
  outputSchema: rawSchemas.products,
  props: {
    storeId: Property.Dropdown({
      displayName: 'Store',
      description: 'Filter products by store. Leave empty to return products from all stores.',
      required: false,
      auth: lemonSqueezyAuth,
      refreshers: ['auth'],
      options: async ({ auth }) => storeOptions({ auth }),
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (starts at 1).',
      required: false,
      defaultValue: 1,
    }),
    perPage: Property.Number({
      displayName: 'Per Page',
      description: 'Number of products to return per page (1–100). Default is 10.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const queryParams: Record<string, string> = {};

    if (propsValue.storeId) queryParams['filter[store_id]'] = propsValue.storeId;
    Object.assign(queryParams, pageParams(propsValue));

    const response = await lsRequest({
      apiKey: auth.secret_text,
      method: 'GET',
      path: '/products',
      query: queryParams,
    });

    return response.body;
  },
});
