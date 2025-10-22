import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeRetrievePaymentIntent = createAction({
  name: 'retrieve_payment_intent',
  auth: stripeAuth,
  displayName: 'Find Payment (by Payment Intent ID)',
  description:
    'Retrieves the details of a payment by its unique Payment Intent ID.',
  props: {
    payment_intent_id: stripeCommon.paymentIntent, 
  },
  async run(context) {
    const { payment_intent_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/payment_intents/${payment_intent_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return response.body;
  },
});
