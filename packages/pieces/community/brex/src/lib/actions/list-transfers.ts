import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexTransfer } from '../common';

export const listTransfers = createAction({
  auth: brexAuth,
  name: 'list_transfers',
  displayName: 'List Transfers',
  description: 'List the payments / transfers made from your Brex account.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of transfers to return (1-100).',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const response = await brexCommon.apiCall<{ items: BrexTransfer[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v1/transfers',
      queryParams: {
        limit: String(context.propsValue.limit ?? 50),
      },
    });
    return response.body.items.map(brexCommon.flattenTransfer);
  },
});
