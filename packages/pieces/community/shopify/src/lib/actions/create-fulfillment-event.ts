import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createFulfillmentEvent } from '../common';
import { ShopifyFulfillmentEventStatuses } from '../common/types';

export const createFulfillmentEventAction = createAction({
  auth: shopifyAuth,
  name: 'create_fulfillment_event',
  displayName: 'Create Fulfillment Event',
  description: 'Create a new fulfillment event.',
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
    status: Property.Dropdown({
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
