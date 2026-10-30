import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { lsRequest, seg } from '../common/client';
import { orderOptions } from '../common/props';
import { rawSchemas } from '../common/output-schemas';
export const getOrder = createAction({
  name: 'get_order',
  classification: 'READ',
  displayName: 'Get Order',
  description: 'Retrieve the details of a specific order by its ID.',
  audience: 'human',
  auth: lemonSqueezyAuth,
  outputSchema: rawSchemas.order,
  props: {
    orderId: Property.Dropdown({
      displayName: 'Order',
      description: 'The order to retrieve (the list shows up to 1,000 orders).',
      required: true,
      auth: lemonSqueezyAuth,
      refreshers: ['auth'],
      options: async ({ auth }) => orderOptions({ auth }),
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const response = await lsRequest({
      apiKey: auth.secret_text,
      method: 'GET',
      path: `/orders/${seg({ value: propsValue.orderId, label: 'Order' })}`,
    });
    return response.body;
  },
});
