import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth, ninjapipeCommon } from '../common';

export const deleteOrder = createAction({
  auth: ninjapipeAuth,
  name: 'delete_order',
  displayName: 'Delete Order',
  description: 'Deletes an order by ID.',
  props: {
    orderId: ninjapipeCommon.orderDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.DELETE, path: `/orders/${encodeURIComponent(String(context.propsValue.orderId))}` });
    return { success: true, deleted_id: context.propsValue.orderId };
  },
});
