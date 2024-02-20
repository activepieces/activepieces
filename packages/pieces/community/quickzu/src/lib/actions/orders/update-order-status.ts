import { Property, createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../..';
import { makeClient, quickzuCommon } from '../../common';
import { OrderStatus } from '../../common/constants';

export const updateOrderStatusAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_update_order_status',
  displayName: 'Update Order Status',
  description: 'Updates status of order in store.',
  props: {
    orderId: quickzuCommon.orderId(true),
    status: Property.StaticDropdown({
      displayName: 'Order Status',
      required: true,
      options: {
        disabled: false,
        options: Object.values(OrderStatus).map((value) => {
          return {
            label: value,
            value: value,
          };
        }),
      },
    }),
  },
  async run(context) {
    const { orderId, status } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.updateOrderStatus(orderId!, status);
  },
});
