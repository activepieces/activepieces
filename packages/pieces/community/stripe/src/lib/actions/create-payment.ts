import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';

export const createPayment = createAction({
  auth: stripeAuth,
  name: 'createPayment',
  displayName: 'Create Payment',
  description: 'Create a Stripe Payment Intent.',
  props: {
    amount: Property.Number({
      displayName: 'Amount (in cents)',
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
    payment_method: Property.ShortText({
      displayName: 'Payment Method ID',
      required: true,
      defaultValue: 'pm_card_visa',
    }),
    confirmation_method: Property.ShortText({
      displayName: 'Confirmation Method',
      required: false,
      defaultValue: 'manual',
    }),
    confirm: Property.Checkbox({
      displayName: 'Confirm Immediately',
      required: false,
      defaultValue: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      required: false,
      description: 'Key-value pairs to attach to the payment intent.',
    }),
    receipt_email: Property.ShortText({
      displayName: 'Receipt Email',
      description:
        "The email address to send a receipt to. This will override the customer's email address.",
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      amount,
      currency,
      payment_method,
      confirmation_method,
      confirm,
      description,
      receipt_email,
      metadata,
    } = propsValue;

    const body: Record<string, any> = {
      amount,
      currency,
      payment_method,
      confirmation_method,
      confirm,
      description,
      receipt_email,
    };

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        body[`metadata[${key}]`] = value;
      });
      delete body.metadata;
    }

    Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.stripe.com/v1/payment_intents',
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});