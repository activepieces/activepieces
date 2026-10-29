import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { flatten, lsRequest, readPath, seg, toResource } from '../common/client';
import { flatFields, recordSchema } from '../common/output-schemas';

export const getOrderAi = createAction({
  auth: lemonSqueezyAuth,
  name: 'get_order_ai',
  displayName: 'Get Order (AI)',
  description: 'Retrieve an order and its items by order ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one Lemon Squeezy order by numeric order ID (not the order number shown to customers), with totals in cents, status, customer email, receipt URL and all order items. Use List Orders to find the ID by email or status. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: recordSchema([...flatFields.order, { key: 'order_items', label: 'Order Items', listItems: flatFields.orderItem, labelKey: 'product_name' }]),
  props: {
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'The numeric order ID (the "id" field of an order).',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { body } = await lsRequest({
      apiKey: auth.secret_text,
      method: 'GET',
      path: `/orders/${seg({ value: propsValue.orderId, label: 'Order ID' })}`,
      query: { include: 'order-items' },
    });
    const included = readPath({ value: body, path: ['included'] });
    return {
      ...flatten(toResource(readPath({ value: body, path: ['data'] }))),
      order_items: (Array.isArray(included) ? included : [])
        .map(toResource)
        .filter((r) => r.type === 'order-items')
        .map(flatten),
    };
  },
});
