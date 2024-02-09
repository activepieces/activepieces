import { Property, createAction } from '@activepieces/pieces-framework';
import { getOrder } from '../api';
import { cartloomAuth } from '../auth';

export const getOrderAction = createAction({
  name: 'get_order',
  auth: cartloomAuth,
  displayName: 'Get Order',
  description: 'Get an order from Cartloom',
  props: {
    invoice: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'The invoice ID for the order you want to retrieve',
      required: true,
    }),
  },
  async run(context) {
    return await getOrder(context.auth, context.propsValue.invoice);
  },
});
