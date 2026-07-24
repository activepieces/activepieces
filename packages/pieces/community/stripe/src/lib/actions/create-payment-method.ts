import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { paymentMethodOutputSchema } from '../output-schemas';
export const stripeCreatePaymentMethod = createAction({
  name: 'create_payment_method',
  auth: stripeAuth,
  displayName: 'Create Payment Method (Agent)',
  description: 'Create a PaymentMethod from a token.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Stripe PaymentMethod of the given type from a single-use token (e.g. tok_visa, or a token produced by Stripe.js), with optional billing details. NEVER pass raw card numbers — raw PAN entry is restricted to PCI-compliant integrations; supply a token instead. Use before Attach Payment Method. Not idempotent: each call creates a new PaymentMethod.',
    idempotent: false,
  },
  props: {
    type: Property.ShortText({
      displayName: 'Type',
      description: 'The PaymentMethod type (e.g., card).',
      required: true,
    }),
    token: Property.ShortText({
      displayName: 'Card Token',
      description:
        'A single-use card token (e.g., tok_visa or a Stripe.js token). Required for card type. Do NOT pass a raw card number.',
      required: false,
    }),
    billing_name: Property.ShortText({
      displayName: 'Billing Name',
      required: false,
    }),
    billing_email: Property.ShortText({
      displayName: 'Billing Email',
      required: false,
    }),
  },
  outputSchema: paymentMethodOutputSchema,
  async run(context) {
    const { type, token, billing_name, billing_email } = context.propsValue;

    const body: { [key: string]: unknown } = { type };
    if (token) body['card[token]'] = token;
    if (billing_name) body['billing_details[name]'] = billing_name;
    if (billing_email) body['billing_details[email]'] = billing_email;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/payment_methods`,
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
