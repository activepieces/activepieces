import { createAction, Property } from '@activepieces/pieces-framework';
import { ShippoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findOrder = createAction({
  auth: ShippoAuth,
  name: 'find_order',
  displayName: 'Find Order',
  description: 'Retrieve an order from Shippo using its ID',

  props: {
    order_id: Property.Dropdown({
      displayName: 'Order',
      description: 'Select an order to retrieve',
      required: true,
      refreshers: [],
      async options({ auth }) {
        if (!auth) {
          return {
            disabled: true,
            options: [],
          };
        }

        try {

          const data = await makeRequest(
            auth as string,
            HttpMethod.GET,
            '/orders/'
          );

          const options = (data.results || []).map((order: any) => ({
            label: `${order.order_number || order.object_id} — ${order.order_status}`,
            value: order.object_id,
          }));

          return {
            disabled: false,
            options,
          };
        } catch (error: any) {
          console.error('Error fetching orders:', error);
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
  },

  async run({ auth, propsValue }) {
    const { order_id } = propsValue;

    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/orders/${order_id}/`
    );

    return response;
  },
});
