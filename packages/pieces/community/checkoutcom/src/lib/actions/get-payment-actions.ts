import { createAction, Property } from '@activepieces/pieces-framework';
import { checkoutComAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getPaymentActionsAction = createAction({
  name: 'get_payment_actions',
  auth: checkoutComAuth,
  displayName: 'Get Payment Actions',
  description: 'Build full transaction lifecycles for audit logs.',
  props: {
    paymentId: Property.ShortText({
      displayName: 'Payment ID',
      required: true,
    }),
  },
  async run(context) {
    const { paymentId } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.checkout.com/payments/${paymentId}/actions`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
    });
    return response.body;
  },
}); 