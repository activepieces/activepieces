import { createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../auth';
import { makeClient, quickzuCommon } from '../../common';

export const getOrderDetailsAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_get_order_details',
  displayName: 'Get Order Details',
  description: 'Retrieves order details from store.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the full details of a single Quickzu order by its order ID. Use to inspect one specific order (customer, items, totals, status). Requires a known order ID. Idempotent read-only lookup.',
    idempotent: true,
  },
  props: {
    orderId: quickzuCommon.orderId(true),
  },
  async run(context) {
    const { orderId } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.getOrderDetails(orderId!);
  },
});
