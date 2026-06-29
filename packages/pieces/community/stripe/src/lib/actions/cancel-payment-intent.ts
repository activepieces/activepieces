import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeCancelPaymentIntent = createAction({
  name: 'cancel_payment_intent',
  auth: stripeAuth,
  displayName: 'Cancel Payment Intent (Agent)',
  description: 'Cancel a PaymentIntent that has not been captured.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Cancels a PaymentIntent that has not yet been captured (e.g., a manual-capture authorization or an abandoned payment), with an optional cancellation reason. Use to release an authorization or abandon a payment. Idempotent: re-running on an already-canceled PaymentIntent leaves it canceled.',
    idempotent: true,
  },
  props: {
    payment_intent_id: Property.ShortText({
      displayName: 'Payment Intent ID',
      description:
        'The PaymentIntent ID (e.g., pi_...) to cancel. Obtain it from List/Search Payment Intents.',
      required: true,
    }),
    cancellation_reason: Property.StaticDropdown({
      displayName: 'Cancellation Reason',
      description: 'An optional reason for the cancellation.',
      required: false,
      options: {
        options: [
          { label: 'Duplicate', value: 'duplicate' },
          { label: 'Fraudulent', value: 'fraudulent' },
          { label: 'Requested by Customer', value: 'requested_by_customer' },
          { label: 'Abandoned', value: 'abandoned' },
        ],
      },
    }),
  },
  async run(context) {
    const { payment_intent_id, cancellation_reason } = context.propsValue;

    const body: { [key: string]: unknown } = {};
    if (cancellation_reason) body.cancellation_reason = cancellation_reason;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/payment_intents/${payment_intent_id}/cancel`,
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
