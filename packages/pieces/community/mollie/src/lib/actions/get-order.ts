import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon, MollieOrder } from '../common';

export const mollieGetOrder = createAction({
  auth: mollieAuth,
  name: 'get_order',
  displayName: 'Get Order',
  description: 'Retrieve a specific order by ID',
  props: {
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'The ID of the order to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const order = await mollieCommon.getResource<MollieOrder>(
      context.auth,
      'orders',
      context.propsValue.orderId
    );

    return order;
  },
});