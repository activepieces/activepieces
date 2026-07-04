import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getFulfillments } from '../common';

export const getFulfillmentsAction = createAction({
  auth: shopifyAuth,
  name: 'get_fulfillments',
  displayName: 'Get Fulfillments',
  description: `Get an order's fulfillments.`,
  audience: 'both',
  aiMetadata: { description: "List the fulfillments (shipments) recorded for a specific Shopify order, given the order ID. Use to find fulfillment IDs and shipment status, e.g. before posting a Create Fulfillment Event. Read-only and idempotent.", idempotent: true },
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
