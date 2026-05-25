import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

export const getOrderStatus = createAction({
  auth: virtualSmsAuth,
  name: 'get_order_status',
  displayName: 'Get Order Status',
  description: 'Get current status and any received SMS for an order',
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'Order UUID returned by Buy Number',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return request(
      auth,
      HttpMethod.GET,
      `/api/v1/customer/order/${encodeURIComponent(propsValue.order_id)}`
    );
  },
});
