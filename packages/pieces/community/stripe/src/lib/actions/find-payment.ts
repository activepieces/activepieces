import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';

export const findPayment = createAction({
  auth: stripeAuth,
  name: 'findPayment',
  displayName: 'Find Payment',
  description: 'Find a Payment object by its ID.',
  props: {
    paymentId: Property.ShortText({
      displayName: 'Payment ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { paymentId } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.stripe.com/v1/payment_intents/${paymentId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    return response.body;
  },
});