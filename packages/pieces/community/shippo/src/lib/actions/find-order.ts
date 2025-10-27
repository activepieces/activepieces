import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { shippoAuth } from '../../';
import { shippoCommon } from '../common/client';

export const findOrder = createAction({
  auth: shippoAuth,
  name: 'find_order',
  displayName: 'Find an Order',
  description: 'Searches for an order by its ID',
  props: {
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'The unique identifier for the order',
      required: true,
    }),
  },
  async run(context) {
    const response = await shippoCommon.makeRequest(
      context.auth as string,
      HttpMethod.GET,
      `/orders/${context.propsValue.orderId}`
    );

    return response.body;
  },
});

