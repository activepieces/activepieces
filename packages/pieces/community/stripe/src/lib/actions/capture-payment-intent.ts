import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { paymentIntentOutputSchema } from '../output-schemas';
export const stripeCapturePaymentIntent = createAction({
  name: 'capture_payment_intent',
  auth: stripeAuth,
  displayName: 'Capture Payment Intent (Agent)',
  description: 'Capture funds from an authorized PaymentIntent.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Captures the funds of a PaymentIntent that was authorized with manual capture (status requires_capture). Optionally capture a partial amount (in the smallest currency unit, e.g. cents) and mark it as the final capture. Use to settle a held authorization. Money-moving and not idempotent.',
    idempotent: false,
  },
  props: {
    payment_intent_id: Property.ShortText({
      displayName: 'Payment Intent ID',
      description:
        'The PaymentIntent ID (e.g., pi_...) to capture. Obtain it from List/Search Payment Intents.',
      required: true,
    }),
    amount_to_capture: Property.Number({
      displayName: 'Amount to Capture',
      description:
        'The amount to capture in the smallest currency unit (e.g., 1050 for $10.50). Defaults to the full authorized amount.',
      required: false,
    }),
    final_capture: Property.Checkbox({
      displayName: 'Final Capture',
      description:
        'If true, the remaining uncaptured amount is released back to the customer.',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'A set of key-value pairs to attach.',
      required: false,
    }),
  },
  outputSchema: paymentIntentOutputSchema,
  async run(context) {
    const { payment_intent_id, amount_to_capture, final_capture, metadata } =
      context.propsValue;

    const body: { [key: string]: unknown } = {};
    if (amount_to_capture !== undefined && amount_to_capture !== null) {
      body.amount_to_capture = amount_to_capture;
    }
    if (final_capture !== undefined) body.final_capture = final_capture;
    if (metadata && typeof metadata === 'object') {
      Object.keys(metadata).forEach((key) => {
        body[`metadata[${key}]`] = (metadata as Record<string, string>)[key];
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/payment_intents/${payment_intent_id}/capture`,
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
