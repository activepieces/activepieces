import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createFulfillmentEvent } from '../common';
import { ShopifyFulfillmentEventStatuses } from '../common/types';

export const createFulfillmentEventAction = createAction({
  auth: shopifyAuth,
  name: 'create_fulfillment_event',
  classification: 'WRITE',
  displayName: 'Create Fulfillment Event',
  description: 'Add a tracking status to a fulfillment.',
  audience: 'both',
  aiMetadata: { description: 'Record a tracking-status event (e.g. in transit, delivered) on an existing fulfillment within an order. Use to post shipment progress updates; requires the order ID, fulfillment ID, and a status. Each call appends a new event, so repeating it adds duplicate events.', idempotent: false },
  propertyGroups: [
    {
      key: 'shipment',
      display: 'section',
      label: 'Shipment',
      icon: 'send',
      props: ['orderId', 'fulfillmentId'],
    },
    {
      key: 'event',
      display: 'section',
      label: 'Tracking update',
      icon: 'location',
      props: ['status', 'message'],
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
    status: Property.Dropdown({
      auth: shopifyAuth,
      displayName: 'Status',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: Object.values(ShopifyFulfillmentEventStatuses).map(
            (status) => {
              return {
                label:
                  status.charAt(0).toUpperCase() +
                  status.slice(1).replaceAll('_', ' '),
                value: status,
              };
            }
          ),
        };
      },
    }),
    message: Property.ShortText({
      displayName: 'Message',
      description: 'A short note about this status.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { orderId, fulfillmentId, status, message } = propsValue;

    return await createFulfillmentEvent(
      fulfillmentId,
      orderId,
      {
        status,
        message,
      },
      auth
    );
  },
});
