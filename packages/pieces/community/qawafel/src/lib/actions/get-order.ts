import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { qawafelAuth } from '../common/auth';
import { qawafelApiCall } from '../common/client';

export const getOrder = createAction({
  auth: qawafelAuth,
  name: 'get_order',
  displayName: 'Get Order',
  description:
    'Fetch a single order by its Qawafel ID. Returns the full order including line items, totals, delivery details, and current state.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves a single order by its Qawafel order id (the `ord_` identifier), including line items, totals, delivery details, and current state. Use when you have an order id and need its current details, e.g. to check status before acting. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description:
        'The Qawafel order ID (starts with `ord_`). You can get this from a trigger, the "List Orders" action, or your dashboard.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await qawafelApiCall({
      auth,
      method: HttpMethod.GET,
      path: `/orders/${propsValue.order_id}`,
    });
    return response.body;
  },
});
