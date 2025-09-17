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
        'The ID of the Payment Method to attach to this Payment Intent (e.g., `pm_...`). Required if you want to confirm the payment immediately.',
      required: false,
    }),
    confirm: Property.Checkbox({
      displayName: 'Confirm Payment',
      description:
        'If true, Stripe will attempt to charge the provided payment method immediately. A `Payment Method ID` is required for this.',
      required: false,
      defaultValue: false,
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
      description,
      receipt_email,
    } = context.propsValue;

    if (confirm && !payment_method) {
      throw new Error(
        "A Payment Method ID is required when 'Confirm Payment' is set to true."
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
    if (description) body.description = description;
    if (receipt_email) body.receipt_email = receipt_email;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/payment_intents`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      body: body,
    });

    return response.body;
  },
});
