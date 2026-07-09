import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const listUserPaymentMethodsAction = createAction({
  name: 'list_user_payment_methods',
  displayName: 'List User Payment Methods',
  description: 'List all payment methods for your user account',
  audience: 'both',
  aiMetadata: { description: 'List the saved payment methods on the authenticated user account, with optional limit/offset paging. Use this to enumerate or look up a payment method ID; for a single stored billing record use Get User Payment Info. Read-only and safe to repeat.', idempotent: true },
  auth: zooAuth,
  // category: 'Payments',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      description: 'Maximum number of payment methods to return',
    }),
    offset: Property.Number({
      displayName: 'Offset',
      required: false,
      description: 'Number of payment methods to skip',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user/payment/methods',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      queryParams: {
        ...(propsValue.limit && { limit: propsValue.limit.toString() }),
        ...(propsValue.offset && { offset: propsValue.offset.toString() }),
      },
    });
    return response.body;
  },
});
