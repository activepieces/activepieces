import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createUserPaymentAction = createAction({
  name: 'create_user_payment',
  displayName: 'Create User Payment Info',
  description: 'Create payment information for your user account',
  audience: 'both',
  aiMetadata: { description: 'Attach a payment method to the authenticated user\'s own Zoo account using the given payment method ID. Use for the individual user; the organization equivalent is the org payment update action. Not idempotent: each call registers payment information.', idempotent: false },
  auth: zooAuth,
  // category: 'Payments',
  props: {
    paymentMethodId: Property.ShortText({
      displayName: 'Payment Method ID',
      required: true,
      description: 'ID of the payment method to use',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.zoo.dev/user/payment',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: {
        payment_method_id: propsValue.paymentMethodId,
      },
    });
    return response.body;
  },
});
