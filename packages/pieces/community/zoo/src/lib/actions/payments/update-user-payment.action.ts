import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateUserPaymentAction = createAction({
  name: 'update_user_payment',
  displayName: 'Update User Payment Info',
  description: 'Update payment information for your user account',
  audience: 'both',
  aiMetadata: { description: 'Set or replace the payment method on the authenticated user account, given an existing payment method ID. Use for the individual user (the org has its own payment actions); this mutates the stored billing record, so confirm the ID before calling.', idempotent: false },
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
      method: HttpMethod.PUT,
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
