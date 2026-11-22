import { createAction } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';
import { orderStatusListOutputSchema } from '../common/schemas';

export const listOrderStatuses = createAction({
  auth: bigcommerceAuth,
  name: 'listOrderStatuses',
  classification: 'SEARCH',
  displayName: 'List Order Statuses',
  description: 'Lists the order statuses of the store and their IDs',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every order status in the BigCommerce store with its numeric id, system name and the store’s custom label. Use to find a status_id for List Orders or Update Order Status. Returns the full list in one call. Read-only.',
    idempotent: true,
  },
  outputSchema: orderStatusListOutputSchema,
  props: {},
  async run(context) {
    return await bigCommerceApiService.fetchOrderStatuses({
      auth: context.auth.props,
    });
  },
});
