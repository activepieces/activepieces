import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { cancelOrder } from '../common';

export const cancelOrderAction = createAction({
  auth: shopifyAuth,
  name: 'cancel_order',
  displayName: 'Cancel Order',
  description: `Cancel an order.`,
  audience: 'both',
  aiMetadata: { description: 'Cancel an existing Shopify order by its ID, which may trigger refunds and restocking per store settings. Use to void or back out an order; distinct from Close Order, which only marks a fulfilled order complete. Cancelling an already-cancelled order is rejected, so it is not safely repeatable.', idempotent: false },
  props: {
    orderId: Property.Number({
      displayName: 'Order',
      description: 'The ID of the order.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { orderId } = propsValue;

    return await cancelOrder(orderId, auth);
  },
});
