import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getFulfillment } from '../common';

export const getFulfillmentAction = createAction({
  auth: shopifyAuth,
  name: 'get_fulfillment',
  displayName: 'Get Fulfillment',
  description: `Get a fulfillment.`,
  props: {
    orderId: Property.Number({
      displayName: 'Order',
      description: 'The ID of the order.',
      required: true,
    }),
    fulfillmentId: Property.Number({
      displayName: 'Fulfillment',
      description: 'The ID of the fulfillment.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { orderId, fulfillmentId } = propsValue;

    return await getFulfillment(fulfillmentId, orderId, auth);
  },
});
