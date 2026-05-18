import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { cancelOrder } from '../common';

export const cancelOrderAction = createAction({
  auth: shopifyAuth,
  name: 'cancel_order',
  displayName: 'Cancel Order',
  description: `Cancel an order.`,
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
