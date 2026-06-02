import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { qawafelAuth } from '../common/auth';
import { qawafelApiCall } from '../common/client';
import { qawafelProps } from '../common/props';

export const cancelOrder = createAction({
  auth: qawafelAuth,
  name: 'cancel_order',
  displayName: 'Cancel Order',
  description:
    'Cancel an open order. Once cancelled, the order cannot be reopened — the only path forward is to create a new order.',
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description:
        'The Qawafel order ID (starts with `ord_`) you want to cancel.',
      required: true,
    }),
    reason: Property.LongText({
      displayName: 'Cancellation Reason',
      description:
        'Optional but recommended. A short note explaining why the order is being cancelled (max 500 characters).',
      required: false,
    }),
    idempotency_key: qawafelProps.idempotencyKey,
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (propsValue.reason) {
      body['reason'] = propsValue.reason;
    }
    const response = await qawafelApiCall({
      auth,
      method: HttpMethod.POST,
      path: `/orders/${propsValue.order_id}/cancel`,
      body,
      idempotencyKey: propsValue.idempotency_key,
    });
    return response.body;
  },
});
