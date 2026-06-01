import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexVendor } from '../common';

export const listVendors = createAction({
  auth: brexAuth,
  name: 'list_vendors',
  displayName: 'List Vendors',
  description: 'List the vendors set up in your Brex account.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of vendors to return (1-100).',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const response = await brexCommon.apiCall<{ items: BrexVendor[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v1/vendors',
      queryParams: {
        limit: String(context.propsValue.limit ?? 50),
      },
    });
    return response.body.items.map(brexCommon.flattenVendor);
  },
});
