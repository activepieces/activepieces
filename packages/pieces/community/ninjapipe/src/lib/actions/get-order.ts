import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const getOrder = createAction({
  auth: ninjapipeAuth,
  name: 'get_order',
  displayName: 'Get Order',
  description: 'Retrieves an order by ID.',
  props: {
    orderId: Property.ShortText({ displayName: 'Order ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.GET, path: `/orders/${context.propsValue.orderId}` });
    return flattenCustomFields(response.body);
  },
});
