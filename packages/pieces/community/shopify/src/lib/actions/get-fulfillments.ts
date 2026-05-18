import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getFulfillments } from '../common';

export const getFulfillmentsAction = createAction({
  auth: shopifyAuth,
  name: 'get_fulfillments',
  displayName: 'Get Fulfillments',
  description: `Get an order's fulfillments.`,
  props: {
    orderId: Property.Number({
      displayName: 'Order',
      description: 'The ID of the order.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { orderId } = propsValue;

    return await getFulfillments(orderId, auth);
  },
});
