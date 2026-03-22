import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { lemonSqueezyAuth, LEMON_SQUEEZY_API_BASE, getLemonSqueezyHeaders } from '../auth';

export const getOrder = createAction({
  name: 'get_order',
  displayName: 'Get Order',
  description: 'Retrieve the details of a specific order by its ID.',
  auth: lemonSqueezyAuth,
  props: {
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'The ID of the order to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${LEMON_SQUEEZY_API_BASE}/orders/${propsValue.orderId}`,
      headers: getLemonSqueezyHeaders(auth as string),
    });

    return response.body;
  },
});
