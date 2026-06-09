import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const getOrder = createAction({
  auth: ninjapipeAuth,
  name: 'get_order',
  displayName: 'Get Order',
  description: 'Retrieves an order by ID.',
  props: {
    orderId: ninjapipeCommon.orderDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: `/orders/${encodeURIComponent(String(context.propsValue.orderId))}` });
    return flattenCustomFields(response.body);
  },
});
