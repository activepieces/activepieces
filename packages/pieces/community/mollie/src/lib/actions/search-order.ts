import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';
import { MollieApi } from '../common/common';

export const searchOrderAction = createAction({
  auth: mollieAuth,
  name: 'search_order',
  displayName: 'Search Order',
  description: 'searches for order in Mollie',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of orders to return (max 250)',
      required: false,
      defaultValue: 50,
    }),
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'Order ID',
      required: true,
    }),
  },
  async run(context) {
    const api = new MollieApi({ accessToken: context.auth.access_token });
    
    const params: any = {};
    if (context.propsValue.limit) params.limit = context.propsValue.limit;
    if (context.propsValue.orderId) params.from = context.propsValue.orderId;

    return await api.searchOrders(params);
  },
});