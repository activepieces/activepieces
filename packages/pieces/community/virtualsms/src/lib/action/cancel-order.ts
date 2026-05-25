import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

export const cancelOrder = createAction({
  auth: virtualSmsAuth,
  name: 'cancel_order',
  displayName: 'Cancel Order',
  description:
    'Cancel an order and trigger refund. Returns HTTP 425 inside the 120-second cooldown after purchase.',
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
      HttpMethod.POST,
      `/api/v1/customer/cancel/${encodeURIComponent(propsValue.order_id)}`
    );
  },
});
