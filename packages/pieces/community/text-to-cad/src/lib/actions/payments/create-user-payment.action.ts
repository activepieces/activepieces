import { createAction, Property } from '@activepieces/pieces-framework';
import { textToCadAuth } from '../../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createUserPaymentAction = createAction({
  name: 'create_user_payment',
  displayName: 'Create User Payment Info',
  description: 'Create payment information for your user account',
  auth: textToCadAuth,
  category: 'Payments',
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
        Authorization: `Bearer ${auth}`,
      },
      body: {
        payment_method_id: propsValue.paymentMethodId,
      },
    });
    return response.body;
  },
});
