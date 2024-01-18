import { createAction, Property } from '@activepieces/pieces-framework';
import { Order } from '../../common/Order';
import { vtexAuth } from '../../..';

export const getOrderById = createAction({
  auth: vtexAuth,
  name: 'get-order-by-id',
  displayName: 'Get Order By ID',
  description: 'Find a Order by Id',
  props: {
    OrderId: Property.Number({
      displayName: 'Order ID',
      description: 'The Order ID',
      required: true,
    }),
  },
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth;
    const { OrderId } = context.propsValue;

    const order = new Order(hostUrl, appKey, appToken);

    return await order.getOrderById(OrderId);
  },
});
