import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';
import { orderOutputSchema } from '../common/schemas';
import { parseNonNegativeIntId, parsePositiveIntId } from '../common/shared-runs';

export const updateOrderStatus = createAction({
  auth: bigcommerceAuth,
  name: 'updateOrderStatus',
  classification: 'WRITE',
  displayName: 'Update Order Status',
  description: 'Changes the status of an order',
  audience: 'both',
  aiMetadata: {
    description:
      'Sets the status of one BigCommerce order. order_id is the numeric order id; status_id is a numeric status id from List Order Statuses (for example 2 = Shipped, 10 = Completed in a default store). Returns the updated order. BigCommerce may email the customer about the status change, depending on the store’s notification settings. Idempotent: setting the same status again leaves the order unchanged.',
    idempotent: true,
  },
  outputSchema: orderOutputSchema,
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'Numeric BigCommerce order ID',
      required: true,
    }),
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description: 'Numeric status ID. Use List Order Statuses to find it.',
      required: true,
    }),
  },
  async run(context) {
    const orderId = parsePositiveIntId({ value: context.propsValue.order_id, field: 'Order ID' });
    const statusId = parseNonNegativeIntId({ value: context.propsValue.status_id, field: 'Status ID' });
    return await bigCommerceApiService.updateOrder({
      auth: context.auth.props,
      orderId,
      payload: { status_id: statusId },
    });
  },
});
