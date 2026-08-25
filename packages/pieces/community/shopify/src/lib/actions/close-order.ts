import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { closeOrder } from '../common';

export const closeOrderAction = createAction({
  auth: shopifyAuth,
  name: 'close_order',
  displayName: 'Close Order',
  description: `Close an order.`,
  audience: 'both',
  aiMetadata: { description: 'Mark an existing Shopify order as closed (archived/complete) by its ID, without cancelling it. Use to archive a finished order; choose Cancel Order instead to void it and trigger refunds/restock. Closing an already-closed order is rejected, so it is not safely repeatable.', idempotent: false },
  props: {
    orderId: Property.Number({
      displayName: 'Order',
      description: 'The ID of the order.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { orderId } = propsValue;

    return await closeOrder(orderId, auth);
  },
});
