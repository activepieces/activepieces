import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon, MollieOrder } from '../common';

export const mollieCancelOrder = createAction({
  auth: mollieAuth,
  name: 'cancel_order',
  displayName: 'Cancel Order',
  description: 'Cancel an order (only possible for certain order statuses)',
  props: {
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'The ID of the order to cancel',
      required: true,
    }),
  },
  async run(context) {
    const order = await mollieCommon.deleteResource<MollieOrder>(
      context.auth,
      'orders',
      context.propsValue.orderId
    );

    return order;
  },
});