import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth } from '../common';

export const deleteOrder = createAction({
  auth: ninjapipeAuth,
  name: 'delete_order',
  displayName: 'Delete Order',
  description: 'Deletes an order by ID.',
  props: {
    orderId: Property.ShortText({ displayName: 'Order ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.DELETE, path: `/orders/${context.propsValue.orderId}` });
    return { success: true, deleted_id: context.propsValue.orderId };
  },
});
