import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeCreatePaymentIntentAi = createAction({
  name: 'create_payment_intent_ai',
  auth: stripeAuth,
  displayName: 'Create Payment Intent (Agent)',
  description: 'Create a Stripe PaymentIntent to start a payment flow.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Stripe PaymentIntent for an amount and currency, optionally tied to a customer. Leave it unconfirmed to get a client secret for client-side completion, or set confirm with a payment method ID (and return URL) to charge immediately. Amount is in the smallest currency unit (e.g. cents). Not idempotent: each call starts a separate payment.',
    idempotent: false,
  },
  props: {
    amount: Property.Number({
      displayName: 'Amount',
      description:
        'The amount to charge, as a decimal in the major currency unit (e.g., 10.50 for $10.50).',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The three-letter ISO currency code (e.g., usd, eur, gbp).',
      required: true,
    }),
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'The Stripe customer ID (e.g., cus_...) to associate. Obtain it from Search Customers or List Customers.',
      required: false,
    }),
    payment_method: Property.ShortText({
      displayName: 'Payment Method ID',
      description:
        'The PaymentMethod ID to attach (e.g., pm_...). Required to confirm the payment immediately.',
      required: false,
    }),
    confirm: Property.Checkbox({
      displayName: 'Confirm Payment Immediately',
      description:
        'If true, Stripe attempts to charge the provided payment method. Requires a Payment Method ID and a Return URL.',
      required: false,
      defaultValue: false,
    }),
    capture_method: Property.StaticDropdown({
      displayName: 'Capture Method',
      description:
        "When to capture funds. 'automatic' (default) captures immediately on confirmation; 'manual' authorizes only — funds are held and you capture later with Capture Payment Intent (auth-and-capture).",
      required: false,
      options: {
        options: [
          { label: 'Automatic', value: 'automatic' },
          { label: 'Manual (authorize only)', value: 'manual' },
        ],
      },
    }),
    return_url: Property.ShortText({
      displayName: 'Return URL',
      description:
        'URL to redirect the customer back to after authenticating the payment. Required when confirming.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    receipt_email: Property.ShortText({
      displayName: 'Receipt Email',
      description:
        "Email to send a receipt to. Overrides the customer's email.",
      required: false,
    }),
  },
  async run(context) {
    const {
      amount,
      currency,
      customer,
      payment_method,
      confirm,
      return_url,
      description,
      receipt_email,
      capture_method,
    } = context.propsValue;

    if (confirm && !payment_method) {
      throw new Error(
        "A Payment Method ID is required when 'Confirm Payment' is set to true."
      );
    }
    if (confirm && !return_url) {
      throw new Error(
        "A Return URL is required when 'Confirm Payment' is set to true."
      );
    }

    const amountInCents = Math.round(amount * 100);

    const body: { [key: string]: unknown } = {
      amount: amountInCents,
      currency: currency,
    };

    if (customer) body.customer = customer;
    if (payment_method) body.payment_method = payment_method;
    if (capture_method) body.capture_method = capture_method;
    if (confirm) body.confirm = confirm;
    if (return_url) body.return_url = return_url;
    if (description) body.description = description;
    if (receipt_email) body.receipt_email = receipt_email;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/payment_intents`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    return response.body;
  },
});
