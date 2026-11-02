import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { paymentIntentOutputSchema } from '../output-schemas';
export const stripeCreatePaymentIntent = createAction({
  name: 'create_payment_intent',
  classification: 'WRITE',
  auth: stripeAuth,
  displayName: 'Create Payment',
  description: 'Start a payment for an amount, and optionally charge it now.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a Stripe PaymentIntent for a given amount and currency to begin collecting a payment, optionally tied to a customer. Can run in two modes: leave it unconfirmed to obtain a client secret for client-side completion, or set confirm to immediately charge a supplied payment method (which then also requires a return URL). Not idempotent: each call starts a separate payment.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'payment',
      display: 'section',
      label: 'Payment',
      icon: 'tag',
      props: [
        'amount',
        'currency',
        'customer',
        'description',
        'payment_method',
        'confirm',
      ],
    },
  ],
  props: {
    amount: Property.Number({
      displayName: 'Amount',
      description: "In the currency's main unit, e.g. 10.50 for $10.50.",
      required: true,
      width: 'half',
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: true,
      width: 'half',
      options: {
        options: [
          { label: 'US Dollar', value: 'usd' },
          { label: 'Euro', value: 'eur' },
          { label: 'Pound Sterling', value: 'gbp' },
          { label: 'Australian Dollar', value: 'aud' },
          { label: 'Canadian Dollar', value: 'cad' },
          { label: 'Swiss Franc', value: 'chf' },
          { label: 'Chinese Yuan', value: 'cny' },
          { label: 'Japanese Yen', value: 'jpy' },
          { label: 'Indian Rupee', value: 'inr' },
          { label: 'Singapore Dollar', value: 'sgd' },
        ],
      },
    }),
    customer: {
      ...stripeCommon.customer,
      required: false,
      description: "Links the payment to this customer's record.",
    },
    payment_method: Property.ShortText({
      displayName: 'Payment Method ID',
      description: 'Starts with pm_. Needed when Charge Now is on.',
      required: false,
      placeholder: 'pm_...',
    }),
    confirm: Property.Checkbox({
      displayName: 'Charge Now',
      description: 'Charge the payment method right away.',
      required: false,
      defaultValue: false,
      reveals: ['return_url'],
    }),
    return_url: Property.ShortText({
      displayName: 'Return URL',
      description: 'Where the customer returns after any bank check.',
      required: false,
      placeholder: 'https://example.com/return',
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Shown with the payment in your Stripe Dashboard.',
      required: false,
    }),
    receipt_email: Property.ShortText({
      displayName: 'Receipt Email',
      description: "Send the receipt here instead of the customer's email.",
      required: false,
      advanced: true,
      placeholder: 'jane@example.com',
    }),
  },
  outputSchema: paymentIntentOutputSchema,
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
    } = context.propsValue;

    if (confirm && !payment_method) {
      throw new Error('Add a Payment Method ID, or turn off Charge Now.');
    }
    if (confirm && !return_url) {
      throw new Error('Add a Return URL, or turn off Charge Now.');
    }

    const amountInCents = Math.round(amount * 100);

    const body: { [key: string]: unknown } = {
      amount: amountInCents,
      currency: currency,
    };

    if (customer) body.customer = customer;
    if (payment_method) body.payment_method = payment_method;
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
