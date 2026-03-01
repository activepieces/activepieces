import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { closeOrder } from '../common';

export const closeOrderAction = createAction({
  auth: shopifyAuth,
  name: 'close_order',
  displayName: 'Close Order',
  description: `Close an order.`,
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
