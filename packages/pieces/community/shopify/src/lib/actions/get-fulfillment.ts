import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getFulfillment } from '../common';

export const getFulfillmentAction = createAction({
  auth: shopifyAuth,
  name: 'get_fulfillment',
  displayName: 'Get Fulfillment',
  description: `Get a fulfillment.`,
  audience: 'both',
  aiMetadata: { description: 'Look up a single fulfillment by its fulfillment ID within a given order. Read-only and repeatable; use to inspect shipment/fulfillment details when you already know both the order ID and fulfillment ID.', idempotent: true },
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
