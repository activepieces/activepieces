import { Property, createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../auth';
import { makeClient } from '../../common';

export const listLiveOrdersAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_list_live_orders',
  displayName: 'List Live Orders',
  description: 'Retrieves live orders of store.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves currently active (live) orders for a Quickzu store, grouped by order status, with a per-status limit on how many are returned. Use to monitor in-progress orders rather than full history. Idempotent read-only lookup.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName:
        'Number of live orders that need to be fetched per order status',
      required: true,
      defaultValue: 15,
    }),
  },
  async run(context) {
    const { limit } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.listLiveOrders(limit);
  },
});
