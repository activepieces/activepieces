import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getFulfillment } from '../common';

export const getFulfillmentAction = createAction({
  auth: shopifyAuth,
  name: 'get_fulfillment',
  classification: 'READ',
  displayName: 'Get Fulfillment',
  description: `Get a fulfillment.`,
  audience: 'both',
  aiMetadata: { description: 'Look up a single fulfillment by its fulfillment ID within a given order. Read-only and repeatable; use to inspect shipment/fulfillment details when you already know both the order ID and fulfillment ID.', idempotent: true },
  propertyGroups: [
    {
      key: 'fulfillment',
      display: 'section',
      label: 'Fulfillment to get',
      icon: 'inbox',
      props: ['orderId', 'fulfillmentId'],
    },
  ],
  props: {
    orderId: Property.Number({
      displayName: 'Order ID',
      description: "From the order's URL in Shopify admin, not its #1001 number.",
      required: true,
      width: 'half',
    }),
    fulfillmentId: Property.Number({
      displayName: 'Fulfillment ID',
      description: 'Get it from a Get Fulfillments step.',
      required: true,
      width: 'half',
    }),
  },
  async run({ auth, propsValue }) {
    const { orderId, fulfillmentId } = propsValue;

    return await getFulfillment(fulfillmentId, orderId, auth);
  },
});
