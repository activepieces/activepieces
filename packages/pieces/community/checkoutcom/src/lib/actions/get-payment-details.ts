import { createAction, Property } from '@activepieces/pieces-framework';
import { checkoutComAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getPaymentDetailsAction = createAction({
  name: 'get_payment_details',
  auth: checkoutComAuth,
  displayName: 'Get Payment Details',
  description: 'Check transaction amount and status before refunding.',
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
      url: `https://api.checkout.com/payments/${paymentId}`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
    });
    return response.body;
  },
}); 