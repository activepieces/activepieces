import { createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../..';
import { makeClient, quickzuCommon } from '../../common';

export const getOrderDetailsAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_get_order_details',
  displayName: 'Get Order Details',
  description: 'Retrieves order details from store.',
  props: {
    orderId: quickzuCommon.orderId(true),
  },
  async run(context) {
    const { orderId } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.getOrderDetails(orderId!);
  },
});
