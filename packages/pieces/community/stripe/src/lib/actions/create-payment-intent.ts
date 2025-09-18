import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeCreatePaymentIntent = createAction({
  name: 'create_payment_intent',
  auth: stripeAuth,
  displayName: 'Create Payment (Payment Intent)',
  description: 'Creates a new payment intent to start a payment flow.',
  props: {
    amount: Property.Number({
      displayName: 'Amount',
      description:
        'The amount to charge, in a decimal format (e.g., 10.50 for $10.50).',
      required: true,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The three-letter ISO code for the currency.',
      required: true,
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
    customer: stripeCommon.customer,
    payment_method: Property.ShortText({
      displayName: 'Payment Method ID',
      description:
        'The ID of the Payment Method to attach (e.g., `pm_...`). Required if you want to confirm the payment immediately.',
      required: false,
    }),
    confirm: Property.Checkbox({
      displayName: 'Confirm Payment Immediately',
      description:
        'If true, Stripe will attempt to charge the provided payment method. A `Payment Method ID` is required.',
      required: false,
      defaultValue: false,
    }),
    return_url: Property.ShortText({
      displayName: 'Return URL',
      description:
        'The URL to redirect your customer back to after they authenticate their payment. Required when confirming the payment.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    receipt_email: Property.ShortText({
      displayName: 'Receipt Email',
      description:
        "The email address to send a receipt to. This will override the customer's email address.",
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
    if (confirm) body.confirm = confirm;
    if (return_url) body.return_url = return_url;
    if (description) body.description = description;
    if (receipt_email) body.receipt_email = receipt_email;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/payment_intents`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    return response.body;
  },
});
