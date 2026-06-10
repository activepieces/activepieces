import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

export const getOrder = createAction({
  auth: bigcommerceAuth,
  name: 'getOrder',
  displayName: 'Get Order',
  description: 'Gets details of an order',
  props: {
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'The ID of the order to retrieve',
      required: true,
    }),
  },
  async run(context) {
    return await bigCommerceApiService.fetchOrder({
      auth: context.auth.props,
      orderId: context.propsValue.orderId,
    });
  },
});
