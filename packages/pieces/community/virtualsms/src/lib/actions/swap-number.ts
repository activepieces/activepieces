import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

export const swapNumber = createAction({
  auth: virtualSmsAuth,
  name: 'swap_number',
  displayName: 'Swap Number',
  description:
    'Get a replacement phone number for an active order. Use this when the current number is not receiving SMS. A 2-minute cooldown applies after purchase.',
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
      `/api/v1/customer/swap/${encodeURIComponent(propsValue.order_id)}`
    );
  },
});
