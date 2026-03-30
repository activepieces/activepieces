import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { lemonSqueezyAuth } from '../common/auth';
import { LEMON_SQUEEZY_API_BASE, getLemonSqueezyHeaders, buildQueryString, fetchStoreOptions } from '../common/api';

export const listProducts = createAction({
  name: 'list_products',
  displayName: 'List Products',
  description: 'Retrieve a paginated list of products from your Lemon Squeezy store.',
  auth: lemonSqueezyAuth,
  props: {
    storeId: Property.Dropdown({
      displayName: 'Store',
      description: 'Filter products by store. Leave empty to return products from all stores.',
      required: false,
      auth: lemonSqueezyAuth,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, placeholder: 'Connect your account first.', options: [] };
        }
        const options = await fetchStoreOptions(auth.secret_text);
        return { options };
      },
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
    if (propsValue.page) queryParams['page[number]'] = String(propsValue.page);
    if (propsValue.perPage) queryParams['page[size]'] = String(propsValue.perPage);

    const url = `${LEMON_SQUEEZY_API_BASE}/products${buildQueryString(queryParams)}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: getLemonSqueezyHeaders(auth.secret_text),
    });

    return response.body;
  },
});
