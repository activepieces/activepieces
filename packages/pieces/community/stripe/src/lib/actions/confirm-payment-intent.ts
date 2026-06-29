import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeConfirmPaymentIntent = createAction({
  name: 'confirm_payment_intent',
  auth: stripeAuth,
  displayName: 'Confirm Payment Intent (Agent)',
  description: 'Confirm a PaymentIntent to attempt the charge.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Confirms a previously-created PaymentIntent to attempt collecting the payment, optionally supplying a payment method and return URL. Use when a PaymentIntent was created unconfirmed and you now want to charge it; Create Payment Intent can also confirm inline. Money-moving and not idempotent.',
    idempotent: false,
  },
  props: {
    payment_intent_id: Property.ShortText({
      displayName: 'Payment Intent ID',
      description:
        'The PaymentIntent ID (e.g., pi_...) to confirm. Obtain it from List/Search Payment Intents.',
      required: true,
    }),
    payment_method: Property.ShortText({
      displayName: 'Payment Method ID',
      description: 'The PaymentMethod ID to use (e.g., pm_...).',
      required: false,
    }),
    return_url: Property.ShortText({
      displayName: 'Return URL',
      description:
        'URL to redirect to after authentication. Required for redirect-based payment methods.',
      required: false,
    }),
  },
  async run(context) {
    const { payment_intent_id, payment_method, return_url } =
      context.propsValue;

    const body: { [key: string]: unknown } = {};
    if (payment_method) body.payment_method = payment_method;
    if (return_url) body.return_url = return_url;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/payment_intents/${payment_intent_id}/confirm`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});
