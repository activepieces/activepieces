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
    currency: Property.ShortText({
      displayName: 'Currency',
      required: true,
      defaultValue: 'usd',
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
  },
  async run({ auth, propsValue }) {
    const {
      amount,
      currency,
      payment_method,
      confirmation_method,
      confirm,
      description,
      metadata,
    } = propsValue;

    const body: Record<string, any> = {
      amount,
      currency,
      payment_method,
      confirmation_method,
      confirm,
      description,
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